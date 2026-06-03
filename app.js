document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    const fileDetailsContainer = document.getElementById('fileDetailsContainer');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const swapBtn = document.getElementById('swapBtn');
    const statsPanel = document.getElementById('statsPanel');
    
    // Stats display elements
    const statPoints = document.getElementById('statPoints');
    const statName = document.getElementById('statName');
    const origLat = document.getElementById('origLat');
    const origLon = document.getElementById('origLon');
    const swapLat = document.getElementById('swapLat');
    const swapLon = document.getElementById('swapLon');
    const resetBtn = document.getElementById('resetBtn');

    // App state
    let selectedFile = null;
    let fileContent = null;

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
            handleFileSelection(files[0]);
        }
    });

    // Handle manual file input selection
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });

    // --- File Handling and Validation ---

    function showError(msg) {
        errorMessage.textContent = msg;
        errorAlert.classList.remove('hidden');
        fileDetailsContainer.classList.add('hidden');
        statsPanel.classList.add('hidden');
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

    function handleFileSelection(file) {
        hideError();
        
        // Basic check for file extension
        if (!file.name.toLowerCase().endsWith('.gpx')) {
            showError("Format de fichier non supporté. Veuillez sélectionner un fichier avec l'extension .gpx.");
            return;
        }

        selectedFile = file;
        
        // Read file contents
        const reader = new FileReader();
        reader.onload = (e) => {
            fileContent = e.target.result;
            
            // Show details card
            fileName.textContent = file.name;
            fileSize.textContent = formatBytes(file.size);
            
            dropzone.classList.add('hidden');
            fileDetailsContainer.classList.remove('hidden');
            statsPanel.classList.add('hidden');
        };
        
        reader.onerror = () => {
            showError("Erreur lors de la lecture du fichier.");
        };

        reader.readAsText(file);
    }

    // Remove selected file and return to initial state
    removeFileBtn.addEventListener('click', resetApp);
    resetBtn.addEventListener('click', resetApp);

    function resetApp() {
        selectedFile = null;
        fileContent = null;
        fileInput.value = ''; // Reset file input element
        
        dropzone.classList.remove('hidden');
        fileDetailsContainer.classList.add('hidden');
        statsPanel.classList.add('hidden');
        hideError();
    }

    // --- Core Processing Logic (Swap) ---

    swapBtn.addEventListener('click', () => {
        if (!fileContent || !selectedFile) {
            showError("Aucun fichier n'est actuellement chargé.");
            return;
        }

        try {
            hideError();
            
            // Parse XML text to DOM
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(fileContent, "application/xml");
            
            // Check for XML parsing errors
            const parserErrors = xmlDoc.getElementsByTagName('parsererror');
            if (parserErrors.length > 0) {
                throw new Error("Erreur de syntaxe XML. Le fichier GPX semble corrompu.");
            }
            
            // Check for valid GPX root node
            if (xmlDoc.documentElement.nodeName.toLowerCase() !== 'gpx') {
                throw new Error("Ce fichier n'est pas un fichier GPX valide (balise <gpx> manquante ou incorrecte).");
            }

            // Find all nodes that have both lat and lon attributes
            const points = xmlDoc.querySelectorAll('[lat][lon]');
            if (points.length === 0) {
                throw new Error("Aucun point de coordonnées (latitude et longitude) n'a été trouvé dans le fichier.");
            }

            let swapCount = 0;
            let originalStartPoint = null;
            let swappedStartPoint = null;

            // Perform the swap
            points.forEach((point, index) => {
                const rawLat = point.getAttribute('lat');
                const rawLon = point.getAttribute('lon');
                
                const lat = parseFloat(rawLat);
                const lon = parseFloat(rawLon);

                if (isNaN(lat) || isNaN(lon)) {
                    // Skip or keep as is if attributes aren't numeric
                    return;
                }

                // Capture details of the first point for visual stats
                if (swapCount === 0) {
                    originalStartPoint = { lat: rawLat, lon: rawLon };
                    swappedStartPoint = { lat: rawLon, lon: rawLat };
                }

                // Swap values
                point.setAttribute('lat', rawLon);
                point.setAttribute('lon', rawLat);
                swapCount++;
            });

            if (swapCount === 0) {
                throw new Error("Aucune coordonnée numérique valide n'a pu être inversée.");
            }

            // Serialize updated XML document back to string
            const serializer = new XMLSerializer();
            const updatedXmlString = serializer.serializeToString(xmlDoc);

            // Construct output filename
            const originalName = selectedFile.name;
            let outputName = 'trace_swapped.gpx';
            if (originalName.toLowerCase().endsWith('.gpx')) {
                outputName = originalName.substring(0, originalName.length - 4) + '_swapped.gpx';
            }

            // Generate blob and download link
            // XML serialization does not always add the standard XML declaration at the top,
            // let's ensure we prepended it if it was present originally.
            let finalOutput = updatedXmlString;
            if (fileContent.trim().startsWith('<?xml') && !updatedXmlString.trim().startsWith('<?xml')) {
                const xmlDeclaration = fileContent.match(/^<\?xml[^>]*\?>/);
                if (xmlDeclaration) {
                    finalOutput = xmlDeclaration[0] + '\n' + updatedXmlString;
                }
            }

            const blob = new Blob([finalOutput], { type: 'application/gpx+xml;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = outputName;
            
            // Append to DOM, click, and clean up
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);

            // Update stats display
            statPoints.textContent = swapCount.toLocaleString();
            statName.textContent = outputName;
            
            if (originalStartPoint && swappedStartPoint) {
                origLat.textContent = originalStartPoint.lat;
                origLon.textContent = originalStartPoint.lon;
                swapLat.textContent = swappedStartPoint.lat;
                swapLon.textContent = swappedStartPoint.lon;
            }

            // Transition UI to stats view
            fileDetailsContainer.classList.add('hidden');
            statsPanel.classList.remove('hidden');

        } catch (err) {
            showError(err.message || "Une erreur inattendue est survenue lors de l'inversion.");
            console.error(err);
        }
    });
});
