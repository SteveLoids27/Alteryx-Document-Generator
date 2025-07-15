// Application State
let currentWorkflow = null;
let selectedNode = null;
let uploadedFiles = [];
let recentFiles = JSON.parse(localStorage.getItem('recentFiles') || '[]');

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
const uploadBtn = document.getElementById('uploadBtn');
const selectedFilesContainer = document.getElementById('selectedFiles');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const recentFilesContainer = document.getElementById('recentFiles');
const searchInput = document.getElementById('searchInput');
const toolFilter = document.getElementById('toolFilter');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const expandBtn = document.getElementById('expandBtn');

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
        rankSpacing: 100,
        nodeSpacing: 100,
        ranker: 'tight-tree'
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadRecentFiles();
});

// Event Listeners
function initializeEventListeners() {
    // File input and upload
    fileInput.addEventListener('change', handleFileSelect);
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleDrop);
    uploadBtn.addEventListener('click', handleUpload);
    
    // Controls
    searchInput.addEventListener('input', handleSearch);
    toolFilter.addEventListener('change', handleToolFilter);
    exportBtn.addEventListener('click', handleExport);
    clearBtn.addEventListener('click', handleClear);
    copyBtn.addEventListener('click', handleCopy);
    expandBtn.addEventListener('click', handleExpand);
    
    // View tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            // Handle view switching if needed
        });
    });

    // Workflow visualization controls
    document.getElementById('downloadVisualBtn').addEventListener('click', downloadVisualization);
    document.getElementById('zoomInBtn').addEventListener('click', () => zoomVisualization(1.2));
    document.getElementById('zoomOutBtn').addEventListener('click', () => zoomVisualization(0.8));
    document.getElementById('resetZoomBtn').addEventListener('click', resetVisualization);
}

// File Upload Handlers
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    processSelectedFiles(files);
}

function handleDragOver(event) {
    event.preventDefault();
    uploadZone.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadZone.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = Array.from(event.dataTransfer.files);
    processSelectedFiles(files);
}

function processSelectedFiles(files) {
    const validExtensions = ['.yxmd', '.yxmc', '.yxwz'];
    const validFiles = files.filter(file => {
        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        return validExtensions.includes(extension);
    });
    
    if (validFiles.length !== files.length) {
        showToast('Invalid file type', 'Only .yxmd, .yxmc, and .yxwz files are supported.', 'error');
    }
    
    uploadedFiles = validFiles;
    updateSelectedFilesDisplay();
    updateUploadButton();
}

function updateSelectedFilesDisplay() {
    selectedFilesContainer.innerHTML = '';
    
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-code"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <i class="fas fa-times remove-file" onclick="removeFile(${index})"></i>
        `;
        selectedFilesContainer.appendChild(fileItem);
    });
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateSelectedFilesDisplay();
    updateUploadButton();
}

function updateUploadButton() {
    uploadBtn.disabled = uploadedFiles.length === 0;
    uploadBtn.innerHTML = `
        <i class="fas fa-upload"></i>
        Upload ${uploadedFiles.length} File${uploadedFiles.length !== 1 ? 's' : ''}
    `;
}

// Upload Processing
async function handleUpload() {
    if (uploadedFiles.length === 0) return;
    
    showProgress(true);
    
    try {
        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            const progress = ((i + 1) / uploadedFiles.length) * 100;
            
            updateProgress(progress);
            
            const result = await processFile(file);
            
            if (result.success) {
                addToRecentFiles(result.workflow);
                showToast('Upload successful', `${file.name} has been processed successfully.`, 'success');
            } else {
                showToast('Upload failed', `Failed to process ${file.name}: ${result.error}`, 'error');
            }
        }
        
        uploadedFiles = [];
        updateSelectedFilesDisplay();
        updateUploadButton();
        loadRecentFiles();
        
    } catch (error) {
        showToast('Upload failed', 'An error occurred during upload.', 'error');
    } finally {
        showProgress(false);
    }
}

async function processFile(file) {
    try {
        const xmlContent = await readFileContent(file);
        
        // Basic XML validation
        if (!xmlContent.includes('AlteryxDocument')) {
            throw new Error('Invalid Alteryx workflow file');
        }
        
        const workflow = await parseWorkflow(xmlContent, file.name);
        
        return {
            success: true,
            workflow: workflow
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

async function parseWorkflow(xmlContent, filename) {
    try {
        // Send to Python backend for parsing
        const response = await fetch('/parse-workflow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                xmlContent: xmlContent,
                filename: filename
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to parse workflow');
        }
        
        const result = await response.json();
        
        return {
            id: Date.now(),
            filename: filename,
            fileType: filename.toLowerCase().substring(filename.lastIndexOf('.')),
            xmlContent: xmlContent,
            uploadedAt: new Date().toISOString(),
            nodes: result.nodes || [],
            connections: result.connections || [],
            statistics: result.statistics || {}
        };
    } catch (error) {
        // Fallback to client-side parsing
        return parseWorkflowClientSide(xmlContent, filename);
    }
}

function parseWorkflowClientSide(xmlContent, filename) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlContent, 'application/xml');
        
        const errorNode = doc.querySelector('parsererror');
        if (errorNode) {
            throw new Error('XML parsing error');
        }
        
        const alteryxDoc = doc.querySelector('AlteryxDocument');
        if (!alteryxDoc) {
            throw new Error('Invalid Alteryx document');
        }
        
        const nodes = [];
        const connections = [];
        
        // Parse nodes
        const nodeElements = alteryxDoc.querySelectorAll('Nodes > Node');
        nodeElements.forEach(nodeElement => {
            const toolId = nodeElement.getAttribute('ToolID') || '';
            
            // Extract tool type
            const guiSettings = nodeElement.querySelector('GuiSettings');
            let toolType = 'Unknown';
            if (guiSettings) {
                const plugin = guiSettings.getAttribute('Plugin');
                if (plugin) {
                    toolType = plugin.split('.').pop() || 'Unknown';
                }
            }
            
            // Extract position
            let position = null;
            const positionElement = nodeElement.querySelector('GuiSettings > Position');
            if (positionElement) {
                const x = positionElement.getAttribute('x');
                const y = positionElement.getAttribute('y');
                if (x && y) {
                    position = { x: parseInt(x), y: parseInt(y) };
                }
            }
            
            // Extract configuration
            const configElement = nodeElement.querySelector('Properties > Configuration');
            const configuration = configElement ? elementToObject(configElement) : null;
            
            nodes.push({
                toolId,
                toolType,
                position,
                configuration
            });
        });
        
        // Parse connections
        const connectionElements = alteryxDoc.querySelectorAll('Connections > Connection');
        connectionElements.forEach(connectionElement => {
            const origin = connectionElement.querySelector('Origin');
            const destination = connectionElement.querySelector('Destination');
            
            if (origin && destination) {
                connections.push({
                    originToolId: origin.getAttribute('ToolID') || '',
                    originConnection: origin.getAttribute('Connection') || '',
                    destinationToolId: destination.getAttribute('ToolID') || '',
                    destinationConnection: destination.getAttribute('Connection') || ''
                });
            }
        });
        
        const statistics = calculateStatistics(nodes, connections);
        
        return {
            id: Date.now(),
            filename: filename,
            fileType: filename.toLowerCase().substring(filename.lastIndexOf('.')),
            xmlContent: xmlContent,
            uploadedAt: new Date().toISOString(),
            nodes: nodes,
            connections: connections,
            statistics: statistics
        };
    } catch (error) {
        throw new Error('Failed to parse workflow: ' + error.message);
    }
}

function elementToObject(element) {
    const result = {};
    
    // Add attributes
    if (element.attributes.length > 0) {
        result.attributes = {};
        for (const attr of element.attributes) {
            result.attributes[attr.name] = attr.value;
        }
    }
    
    // Add text content
    if (element.children.length === 0) {
        const textContent = element.textContent?.trim();
        if (textContent) {
            result.text = textContent;
        }
    }
    
    // Add children
    for (const child of element.children) {
        const childName = child.tagName;
        const childValue = elementToObject(child);
        
        if (result[childName]) {
            if (!Array.isArray(result[childName])) {
                result[childName] = [result[childName]];
            }
            result[childName].push(childValue);
        } else {
            result[childName] = childValue;
        }
    }
    
    return result;
}

function calculateStatistics(nodes, connections) {
    const toolTypes = {};
    let inputCount = 0;
    let outputCount = 0;
    
    nodes.forEach(node => {
        toolTypes[node.toolType] = (toolTypes[node.toolType] || 0) + 1;
        
        if (node.toolType.includes('Input') || node.toolType.includes('DbFileInput')) {
            inputCount++;
        }
        if (node.toolType.includes('Output') || node.toolType.includes('DbFileOutput')) {
            outputCount++;
        }
    });
    
    return {
        totalTools: nodes.length,
        totalConnections: connections.length,
        inputTools: inputCount,
        outputTools: outputCount,
        toolTypes: toolTypes
    };
}

// Recent Files Management
function addToRecentFiles(workflow) {
    const existingIndex = recentFiles.findIndex(f => f.filename === workflow.filename);
    if (existingIndex !== -1) {
        recentFiles.splice(existingIndex, 1);
    }
    
    recentFiles.unshift(workflow);
    recentFiles = recentFiles.slice(0, 10); // Keep only 10 recent files
    
    localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
}

function loadRecentFiles() {
    recentFilesContainer.innerHTML = '';
    
    if (recentFiles.length === 0) {
        recentFilesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>No files uploaded yet</p>
            </div>
        `;
        return;
    }
    
    recentFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'recent-file';
        fileItem.innerHTML = `
            <i class="fas fa-project-diagram"></i>
            <div class="recent-file-info">
                <div class="recent-file-name">${file.filename}</div>
                <div class="recent-file-date">${new Date(file.uploadedAt).toLocaleDateString()}</div>
            </div>
        `;
        
        fileItem.addEventListener('click', () => selectWorkflow(file));
        recentFilesContainer.appendChild(fileItem);
    });
}

function selectWorkflow(workflow) {
    currentWorkflow = workflow;
    
    // Update UI
    document.querySelectorAll('.recent-file').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Show workflow content
    showWorkflowContent();
    
    // Update export button
    exportBtn.disabled = false;
}

function showWorkflowContent() {
    if (!currentWorkflow) return;
    
    // Show content areas
    document.getElementById('searchCard').style.display = 'block';
    document.getElementById('statusCard').style.display = 'block';
    document.getElementById('xmlViewer').style.display = 'block';
    document.getElementById('workflowStructure').style.display = 'block';
    document.getElementById('statisticsCard').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
    
    // Show visualization
    document.getElementById('workflowVisualization').style.display = 'block';
    generateWorkflowVisualization();
    
    // Update file info
    document.getElementById('fileInfo').innerHTML = `
        <strong>${currentWorkflow.filename}</strong> • 
        ${currentWorkflow.nodes.length} tools • 
        ${currentWorkflow.connections.length} connections
    `;
    
    // Update tool filter
    updateToolFilter();
    
    // Display XML content
    displayXMLContent();
    
    // Display workflow structure
    displayWorkflowStructure();
    
    // Display statistics
    displayStatistics();
}

function updateToolFilter() {
    const toolTypes = [...new Set(currentWorkflow.nodes.map(node => node.toolType))].sort();
    
    toolFilter.innerHTML = '<option value="all">All Tools</option>';
    toolTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        toolFilter.appendChild(option);
    });
}

function displayXMLContent() {
    const xmlContent = document.getElementById('xmlContent');
    const formattedXML = formatXML(currentWorkflow.xmlContent);
    xmlContent.innerHTML = formattedXML;
}

function formatXML(xmlString) {
    const lines = xmlString.split('\n');
    return lines.map(line => {
        let formattedLine = escapeHtml(line);
        
        // Apply syntax highlighting
        formattedLine = formattedLine
            .replace(/(&lt;\?xml[^&]*&gt;)/g, '<span class="xml-comment">$1</span>')
            .replace(/(&lt;\/?)([a-zA-Z0-9_-]+)/g, '$1<span class="xml-tag">$2</span>')
            .replace(/([a-zA-Z0-9_-]+)(&equals;)/g, '<span class="xml-attribute">$1</span>$2')
            .replace(/(&equals;)(&quot;[^&]*&quot;)/g, '$1<span class="xml-value">$2</span>')
            .replace(/(&lt;!--[^&]*--&gt;)/g, '<span class="xml-comment">$1</span>');
        
        return `<span class="xml-line">${formattedLine}</span>`;
    }).join('\n');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function displayWorkflowStructure() {
    const structureTree = document.getElementById('structureTree');
    
    const toolsByType = currentWorkflow.nodes.reduce((acc, node) => {
        const type = node.toolType || 'Unknown';
        if (!acc[type]) acc[type] = [];
        acc[type].push(node);
        return acc;
    }, {});
    
    let treeHTML = `
        <div class="tree-item">
            <div class="tree-icon"><i class="fas fa-folder-open"></i></div>
            <div class="tree-label">AlteryxDocument</div>
        </div>
        <div class="tree-children">
            <div class="tree-item">
                <div class="tree-icon"><i class="fas fa-folder"></i></div>
                <div class="tree-label">Nodes</div>
                <div class="tree-badge">${currentWorkflow.nodes.length}</div>
            </div>
            <div class="tree-children">
    `;
    
    Object.entries(toolsByType).forEach(([toolType, tools]) => {
        treeHTML += `
            <div class="tree-item">
                <div class="tree-icon"><i class="fas fa-cube"></i></div>
                <div class="tree-label">${toolType}</div>
                <div class="tree-badge">${tools.length}</div>
            </div>
            <div class="tree-children">
        `;
        
        tools.forEach(tool => {
            const positionText = tool.position ? `(${tool.position.x}, ${tool.position.y})` : '';
            treeHTML += `
                <div class="tree-item" onclick="selectNode('${tool.toolId}')">
                    <div class="tree-icon"><i class="fas fa-cog"></i></div>
                    <div class="tree-label">Tool ${tool.toolId} ${positionText}</div>
                </div>
            `;
        });
        
        treeHTML += '</div>';
    });
    
    treeHTML += `
            </div>
            <div class="tree-item">
                <div class="tree-icon"><i class="fas fa-folder"></i></div>
                <div class="tree-label">Connections</div>
                <div class="tree-badge">${currentWorkflow.connections.length}</div>
            </div>
        </div>
    `;
    
    structureTree.innerHTML = treeHTML;
}

function selectNode(toolId) {
    const node = currentWorkflow.nodes.find(n => n.toolId === toolId);
    if (node) {
        selectedNode = node;
        
        // Update tree selection
        document.querySelectorAll('.tree-item').forEach(item => item.classList.remove('selected'));
        event.currentTarget.classList.add('selected');
        
        // Show tool details
        displayToolDetails(node);
    }
}

function displayToolDetails(node) {
    const toolDetails = document.getElementById('toolDetails');
    const toolInfo = document.getElementById('toolInfo');
    
    toolDetails.style.display = 'block';
    
    let detailsHTML = `
        <div class="tool-info">
            <div class="tool-section">
                <h4>Tool Information</h4>
                <div class="tool-property">
                    <span class="tool-property-label">Tool Type:</span>
                    <span class="tool-badge">${node.toolType}</span>
                </div>
                <div class="tool-property">
                    <span class="tool-property-label">Tool ID:</span>
                    <span class="tool-property-value">${node.toolId}</span>
                </div>
    `;
    
    if (node.position) {
        detailsHTML += `
                <div class="tool-property">
                    <span class="tool-property-label">Position:</span>
                    <span class="tool-property-value">X: ${node.position.x}, Y: ${node.position.y}</span>
                </div>
        `;
    }
    
    detailsHTML += `
            </div>
            <div class="tool-section">
                <h4>Configuration</h4>
    `;
    
    if (node.configuration) {
        // Extract common configuration properties
        const config = node.configuration;
        if (config.File) {
            detailsHTML += `
                <div class="tool-property">
                    <span class="tool-property-label">File Path:</span>
                    <span class="tool-property-value">${config.File.text || config.File}</span>
                </div>
            `;
        }
        
        detailsHTML += `
                <div class="tool-property">
                    <span class="tool-property-label">Configuration Available:</span>
                    <span class="tool-property-value">Yes</span>
                </div>
        `;
    } else {
        detailsHTML += `
                <div class="tool-property">
                    <span class="tool-property-label">Configuration:</span>
                    <span class="tool-property-value">None</span>
                </div>
        `;
    }
    
    detailsHTML += `
            </div>
        </div>
    `;
    
    if (node.configuration) {
        detailsHTML += `
            <div class="raw-config">
                <h4>Raw Configuration</h4>
                <pre>${JSON.stringify(node.configuration, null, 2)}</pre>
            </div>
        `;
    }
    
    toolInfo.innerHTML = detailsHTML;
}

function displayStatistics() {
    const statsGrid = document.getElementById('statsGrid');
    const toolBreakdown = document.getElementById('toolBreakdown');
    const stats = currentWorkflow.statistics;
    
    statsGrid.innerHTML = `
        <div class="stat-item">
            <div class="stat-value primary">${stats.totalTools}</div>
            <div class="stat-label">Total Tools</div>
        </div>
        <div class="stat-item">
            <div class="stat-value success">${stats.totalConnections}</div>
            <div class="stat-label">Connections</div>
        </div>
        <div class="stat-item">
            <div class="stat-value warning">${stats.inputTools}</div>
            <div class="stat-label">Input Sources</div>
        </div>
        <div class="stat-item">
            <div class="stat-value danger">${stats.outputTools}</div>
            <div class="stat-label">Output Destinations</div>
        </div>
    `;
    
    let breakdownHTML = '';
    Object.entries(stats.toolTypes).forEach(([type, count]) => {
        breakdownHTML += `
            <div class="breakdown-item">
                <div class="breakdown-type">${type}</div>
                <div class="breakdown-count">${count}</div>
            </div>
        `;
    });
    
    toolBreakdown.innerHTML = breakdownHTML;
}

// Search and Filter
function handleSearch() {
    const query = searchInput.value.toLowerCase();
    if (!currentWorkflow || !query) {
        displayXMLContent();
        return;
    }
    
    const xmlContent = document.getElementById('xmlContent');
    const lines = currentWorkflow.xmlContent.split('\n');
    
    const filteredLines = lines.filter(line => 
        line.toLowerCase().includes(query)
    );
    
    const highlightedXML = filteredLines.map(line => {
        let formattedLine = escapeHtml(line);
        
        // Apply syntax highlighting
        formattedLine = formattedLine
            .replace(/(&lt;\?xml[^&]*&gt;)/g, '<span class="xml-comment">$1</span>')
            .replace(/(&lt;\/?)([a-zA-Z0-9_-]+)/g, '$1<span class="xml-tag">$2</span>')
            .replace(/([a-zA-Z0-9_-]+)(&equals;)/g, '<span class="xml-attribute">$1</span>$2')
            .replace(/(&equals;)(&quot;[^&]*&quot;)/g, '$1<span class="xml-value">$2</span>')
            .replace(/(&lt;!--[^&]*--&gt;)/g, '<span class="xml-comment">$1</span>');
        
        // Highlight search query
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        formattedLine = formattedLine.replace(regex, '<span class="highlight">$1</span>');
        
        return `<span class="xml-line">${formattedLine}</span>`;
    }).join('\n');
    
    xmlContent.innerHTML = highlightedXML;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function handleToolFilter() {
    const selectedType = toolFilter.value;
    // Implement tool filtering logic if needed
}

// Control Actions
function handleExport() {
    if (!currentWorkflow) return;
    
    const blob = new Blob([currentWorkflow.xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentWorkflow.filename}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Export successful', 'XML file has been downloaded.', 'success');
}

function handleClear() {
    currentWorkflow = null;
    selectedNode = null;
    
    // Hide content areas
    document.getElementById('searchCard').style.display = 'none';
    document.getElementById('statusCard').style.display = 'none';
    document.getElementById('xmlViewer').style.display = 'none';
    document.getElementById('workflowStructure').style.display = 'none';
    document.getElementById('toolDetails').style.display = 'none';
    document.getElementById('statisticsCard').style.display = 'none';
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('workflowVisualization').style.display = 'none';
    resetVisualization();
    
    // Clear selections
    document.querySelectorAll('.recent-file').forEach(item => item.classList.remove('active'));
    
    // Disable export button
    exportBtn.disabled = true;
    
    // Clear search
    searchInput.value = '';
}

function handleCopy() {
    if (!currentWorkflow) return;
    
    navigator.clipboard.writeText(currentWorkflow.xmlContent).then(() => {
        showToast('Copied to clipboard', 'XML content has been copied to your clipboard.', 'success');
    }).catch(() => {
        showToast('Copy failed', 'Failed to copy content to clipboard.', 'error');
    });
}

function handleExpand() {
    const xmlContent = document.getElementById('xmlContent');
    xmlContent.classList.toggle('expanded');
    
    const icon = expandBtn.querySelector('i');
    if (xmlContent.classList.contains('expanded')) {
        icon.className = 'fas fa-compress';
    } else {
        icon.className = 'fas fa-expand';
    }
}

// Progress Management
function showProgress(show) {
    uploadProgress.style.display = show ? 'block' : 'none';
    uploadBtn.disabled = show;
}

function updateProgress(percentage) {
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${Math.round(percentage)}%`;
}

// Toast Notifications
function showToast(title, message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconClass = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${iconClass} toast-icon ${type}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <i class="fas fa-times toast-close" onclick="this.parentElement.remove()"></i>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Workflow Visualization Functions
function generateWorkflowVisualization() {
    const diagram = document.getElementById('workflowDiagram');
    
    // Generate Mermaid diagram definition
    let definition = 'graph LR\n';
    definition += '    classDef default fill:#f0f9ff,stroke:#3b82f6,stroke-width:2px,rx:10px,ry:10px\n';
    definition += '    classDef input fill:#ecfdf5,stroke:#10b981,stroke-width:2px,rx:10px,ry:10px\n';
    definition += '    classDef output fill:#fef2f2,stroke:#ef4444,stroke-width:2px,rx:10px,ry:10px\n';
    
    // Add nodes with positions
    currentWorkflow.nodes.forEach(node => {
        const position = node.position ? `<br/>Position: ${node.position.x},${node.position.y}` : '';
        const config = node.configuration ? extractConfigSummary(node.configuration) : '';
        const label = `${node.toolType}${position}${config}`;
        
        // Use circles for nodes
        definition += `    ${node.toolId}[("${label}")]\n`;
        
        // Add classes for input/output nodes
        if (node.toolType.includes('Input')) {
            definition += `    class ${node.toolId} input\n`;
        } else if (node.toolType.includes('Output')) {
            definition += `    class ${node.toolId} output\n`;
        }
    });
    
    // Add connections with curved lines
    currentWorkflow.connections.forEach(conn => {
        definition += `    ${conn.originToolId} --> ${conn.destinationToolId}\n`;
    });
    
    // Clear and render diagram
    diagram.innerHTML = definition;
    mermaid.contentLoaded();
}

function extractConfigSummary(config) {
    let summary = '';
    
    // Extract key configuration details
    if (config.File && config.File.text) {
        summary += `<br/>File: ${config.File.text}`;
    }
    if (config.Query && config.Query.text) {
        const queryPreview = config.Query.text.substring(0, 30) + '...';
        summary += `<br/>Query: ${queryPreview}`;
    }
    if (config.Fields) {
        const fieldCount = Object.keys(config.Fields).length;
        summary += `<br/>Fields: ${fieldCount}`;
    }
    
    return summary;
}

// Visualization Controls
let currentZoom = 1;
const visualizationContainer = document.querySelector('.visualization-container');

function zoomVisualization(factor) {
    currentZoom *= factor;
    const diagram = document.getElementById('workflowDiagram');
    diagram.style.transform = `scale(${currentZoom})`;
}

function resetVisualization() {
    currentZoom = 1;
    const diagram = document.getElementById('workflowDiagram');
    diagram.style.transform = 'scale(1)';
}

function downloadVisualization() {
    const svg = document.querySelector('.visualization-container svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentWorkflow.filename}_workflow.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Download successful', 'Workflow visualization has been downloaded.', 'success');
}

// Global function for node selection (called from tree)
window.selectNode = selectNode;