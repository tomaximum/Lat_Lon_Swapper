document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    const fileDetailsContainer = document.getElementById('fileDetailsContainer');
    const fileList = document.getElementById('fileList');
    const filesCountSpan = document.getElementById('fileCount');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const swapBtn = document.getElementById('swapBtn');
    const statsPanel = document.getElementById('statsPanel');
    
    // Stats display elements
    const statFiles = document.getElementById('statFiles');
    const statPoints = document.getElementById('statPoints');
    const origLat = document.getElementById('origLat');
    const origLon = document.getElementById('origLon');
    const swapLat = document.getElementById('swapLat');
    const swapLon = document.getElementById('swapLon');
    const resetBtn = document.getElementById('resetBtn');

    // App state - list of selected files
    // Each item: { id: string, file: File, content: string }
    let filesList = [];

    // --- Drag and Drop Handlers ---

    // Prevent default behaviors for drag-and-drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Add/remove visual drag-over indicator
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.remove('dragover');
        }, false);
    });

    // Handle dropped files
    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFilesSelection(files);
        }
    });

    // Handle manual file input selection
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFilesSelection(files);
        }
    });

    // --- File Handling, Loading and Rendering ---

    function showError(msg) {
        errorMessage.textContent = msg;
        errorAlert.classList.remove('hidden');
    }

    function hideError() {
        errorAlert.classList.add('hidden');
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function handleFilesSelection(files) {
        hideError();
        
        // Convert FileList to array and filter out non-gpx files
        const newFiles = Array.from(files).filter(file => {
            const isGpx = file.name.toLowerCase().endsWith('.gpx');
            if (!isGpx) {
                showError(`Le fichier "${file.name}" a été ignoré car ce n'est pas un fichier .gpx.`);
            }
            // Check if file with same name is already loaded
            const isDuplicate = filesList.some(item => item.file.name === file.name);
            return isGpx && !isDuplicate;
        });

        if (newFiles.length === 0) return;

        let loadedCount = 0;
        
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                filesList.push({
                    id: Math.random().toString(36).substring(2, 9),
                    file: file,
                    content: e.target.result
                });
                
                loadedCount++;
                // When all files are read, render the list
                if (loadedCount === newFiles.length) {
                    renderFilesList();
                }
            };
            
            reader.onerror = () => {
                showError(`Erreur lors de la lecture du fichier "${file.name}".`);
            };

            reader.readAsText(file);
        });
    }

    function renderFilesList() {
        fileList.innerHTML = '';
        filesCountSpan.textContent = filesList.length;

        if (filesList.length === 0) {
            resetApp();
            return;
        }

        filesList.forEach(item => {
            const row = document.createElement('div');
            row.className = 'file-item-row';
            row.innerHTML = `
                <div class="file-info-icon">
                    <i class="fa-solid fa-file-code"></i>
                </div>
                <div class="file-item-info">
                    <div class="file-item-name" title="${item.file.name}">${item.file.name}</div>
                    <div class="file-item-size">${formatBytes(item.file.size)}</div>
                </div>
                <button type="button" class="btn-remove" data-id="${item.id}" title="Enlever de la liste">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;

            // Click listener for removing individual file
            row.querySelector('.btn-remove').addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                filesList = filesList.filter(f => f.id !== id);
                renderFilesList();
            });

            fileList.appendChild(row);
        });

        dropzone.classList.add('hidden');
        fileDetailsContainer.classList.remove('hidden');
        statsPanel.classList.add('hidden');
    }

    // Clear all files and reset
    clearAllBtn.addEventListener('click', resetApp);
    resetBtn.addEventListener('click', resetApp);

    function resetApp() {
        filesList = [];
        fileInput.value = ''; // Reset file input
        
        dropzone.classList.remove('hidden');
        fileDetailsContainer.classList.add('hidden');
        statsPanel.classList.add('hidden');
        hideError();
    }

    // --- Batch Swapping Logic ---

    swapBtn.addEventListener('click', () => {
        if (filesList.length === 0) {
            showError("Aucun fichier n'est chargé.");
            return;
        }

        try {
            hideError();
            
            let totalPoints = 0;
            let processedFilesCount = 0;
            let firstOrigPoint = null;
            let firstSwapPoint = null;

            const parser = new DOMParser();
            const serializer = new XMLSerializer();

            filesList.forEach((item, fileIdx) => {
                const xmlDoc = parser.parseFromString(item.content, "application/xml");
                
                // Check XML format
                const parserErrors = xmlDoc.getElementsByTagName('parsererror');
                if (parserErrors.length > 0) {
                    throw new Error(`Erreur de syntaxe XML dans le fichier "${item.file.name}".`);
                }
                
                // Check GPX tag
                if (xmlDoc.documentElement.nodeName.toLowerCase() !== 'gpx') {
                    throw new Error(`Le fichier "${item.file.name}" n'est pas au format GPX valide.`);
                }

                // Query all coordinate attributes
                const points = xmlDoc.querySelectorAll('[lat][lon]');
                if (points.length === 0) {
                    // Skip files with no coordinate points
                    return;
                }

                let filePointsSwapped = 0;

                points.forEach(point => {
                    const rawLat = point.getAttribute('lat');
                    const rawLon = point.getAttribute('lon');
                    
                    const lat = parseFloat(rawLat);
                    const lon = parseFloat(rawLon);

                    if (isNaN(lat) || isNaN(lon)) {
                        return;
                    }

                    // Save coordinates of the first point of the first file for visual feedback
                    if (processedFilesCount === 0 && filePointsSwapped === 0) {
                        firstOrigPoint = { lat: rawLat, lon: rawLon };
                        firstSwapPoint = { lat: rawLon, lon: rawLat };
                    }

                    // Swap values
                    point.setAttribute('lat', rawLon);
                    point.setAttribute('lon', rawLat);
                    filePointsSwapped++;
                });

                if (filePointsSwapped > 0) {
                    totalPoints += filePointsSwapped;
                    processedFilesCount++;

                    // Serialize XML back to string
                    let updatedXmlString = serializer.serializeToString(xmlDoc);
                    if (item.content.trim().startsWith('<?xml') && !updatedXmlString.trim().startsWith('<?xml')) {
                        const xmlDeclaration = item.content.match(/^<\?xml[^>]*\?>/);
                        if (xmlDeclaration) {
                            updatedXmlString = xmlDeclaration[0] + '\n' + updatedXmlString;
                        }
                    }

                    // Build download name
                    const originalName = item.file.name;
                    let outputName = 'trace_swapped.gpx';
                    if (originalName.toLowerCase().endsWith('.gpx')) {
                        outputName = originalName.substring(0, originalName.length - 4) + '_swapped.gpx';
                    }

                    // Download trigger
                    const blob = new Blob([updatedXmlString], { type: 'application/gpx+xml;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    
                    const downloadLink = document.createElement('a');
                    downloadLink.href = url;
                    downloadLink.download = outputName;
                    
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                    URL.revokeObjectURL(url);
                }
            });

            if (processedFilesCount === 0) {
                throw new Error("Aucune coordonnée numérique valide n'a pu être inversée dans les fichiers sélectionnés.");
            }

            // Update stats layout
            statFiles.textContent = processedFilesCount;
            statPoints.textContent = totalPoints.toLocaleString();
            
            if (firstOrigPoint && firstSwapPoint) {
                origLat.textContent = firstOrigPoint.lat;
                origLon.textContent = firstOrigPoint.lon;
                swapLat.textContent = firstSwapPoint.lat;
                swapLon.textContent = firstSwapPoint.lon;
            }

            // Switch to success view
            fileDetailsContainer.classList.add('hidden');
            statsPanel.classList.remove('hidden');

        } catch (err) {
            showError(err.message || "Une erreur est survenue lors de l'inversion.");
            console.error(err);
        }
    });
});
