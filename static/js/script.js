// Global state
let currentData = [];
let currentAddress = '';
let selectedFields = {};
let currentApiStats = {}; // Store current API statistics for popup

// DOM Elements
const addressInput = document.getElementById('addressInput');
const searchBtn = document.getElementById('searchBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const resultsSection = document.getElementById('resultsSection');
const tableBody = document.getElementById('tableBody');
const currentAddressSpan = document.getElementById('currentAddress');
const selectedSummary = document.getElementById('selectedSummary');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');

// Event Listeners
searchBtn.addEventListener('click', fetchData);
addressInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchData();
});
saveBtn.addEventListener('click', saveSelection);
clearBtn.addEventListener('click', clearAllSelections);

// Show/Hide Message Functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
    setTimeout(() => errorMessage.classList.add('hidden'), 5000);
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    setTimeout(() => successMessage.classList.add('hidden'), 3000);
}

function hideMessages() {
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');
}

// Update API Statistics Display
function updateAPIStatistics(apiStats) {
    // Store current stats for popup use
    currentApiStats = apiStats;
    
    document.getElementById('regridAvailable').textContent = apiStats.regrid.available;
    document.getElementById('regridUnavailable').textContent = apiStats.regrid.unavailable;
    document.getElementById('regridTotal').textContent = apiStats.regrid.total;

    document.getElementById('smartyAvailable').textContent = apiStats.smarty.available;
    document.getElementById('smartyUnavailable').textContent = apiStats.smarty.unavailable;
    document.getElementById('smartyTotal').textContent = apiStats.smarty.total;

    document.getElementById('melissaAvailable').textContent = apiStats.melissa.available;
    document.getElementById('melissaUnavailable').textContent = apiStats.melissa.unavailable;
    document.getElementById('melissaTotal').textContent = apiStats.melissa.total;
    
    // Auto-show popup if any API has no data found
    checkAndShowNotFoundPopup(apiStats);
}

// Display Discrepancies
function displayDiscrepancies(discrepancies) {
    const discrepanciesSection = document.getElementById('discrepanciesSection');
    const discrepanciesTableBody = document.getElementById('discrepanciesTableBody');
    discrepanciesTableBody.innerHTML = '';

    if (!discrepancies || discrepancies.length === 0) {
        discrepanciesSection.classList.add('hidden');
        return;
    }

    discrepanciesSection.classList.remove('hidden');

    discrepancies.forEach((disc) => {
        const tr = document.createElement('tr');

        const tdStatus = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = 'status-badge';
        statusBadge.textContent = disc.status;
        tdStatus.appendChild(statusBadge);
        tr.appendChild(tdStatus);

        const tdField = document.createElement('td');
        tdField.textContent = disc.field_name;
        tr.appendChild(tdField);

        tr.appendChild(createDiscrepancyCell(disc.regrid));
        tr.appendChild(createDiscrepancyCell(disc.smarty));
        tr.appendChild(createDiscrepancyCell(disc.melissa));

        discrepanciesTableBody.appendChild(tr);
    });
}

function createDiscrepancyCell(value) {
    const td = document.createElement('td');
    const span = document.createElement('span');
    span.textContent = value || 'N/A';
    td.appendChild(span);
    return td;
}

// Fetch Data
async function fetchData() {
    const address = addressInput.value.trim();
    if (!address) return showError('Please enter an address');

    hideMessages();

    loadingSpinner.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    searchBtn.disabled = true;

    try {
        const response = await fetch('/api/fetch-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address }),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) return showError(result.error || 'Failed');

        currentData = result.data;
        currentAddress = result.address;
        displayResults(result.data, result.address);

        if (result.api_statistics) updateAPIStatistics(result.api_statistics);
        if (result.discrepancies) displayDiscrepancies(result.discrepancies);

        resultsSection.classList.remove('hidden');
        showSuccess('✓ Data loaded');
        
        // Load statistics history after successful fetch
        loadStatisticsHistory();
    } catch (err) {
        showError(err.message);
    } finally {
        loadingSpinner.classList.add('hidden');
        searchBtn.disabled = false;
    }
}

// Display Results
function displayResults(data, address) {
    currentAddressSpan.textContent = address;
    tableBody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.dataset.fieldName = row.field_name;

        // Add field name cell
        const fieldNameCell = document.createElement('td');
        fieldNameCell.textContent = row.field_name;
        fieldNameCell.style.fontWeight = 'bold';
        tr.appendChild(fieldNameCell);

        tr.appendChild(createDataCell(row.field_name, 'regrid', row.regrid));
        tr.appendChild(createDataCell(row.field_name, 'smarty', row.smarty));
        tr.appendChild(createDataCell(row.field_name, 'melissa', row.melissa));

        tableBody.appendChild(tr);
    });
}

// Data Cell
function createDataCell(fieldName, apiName, value) {
    const td = document.createElement('td');
    if (!value) {
        td.textContent = 'N/A';
        return td;
    }

    const container = document.createElement('div');
    container.className = 'checkbox-container';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.field = fieldName;
    checkbox.dataset.api = apiName;
    checkbox.dataset.value = value;
    checkbox.addEventListener('change', handleCheckboxChange);

    const span = document.createElement('span');
    span.className = 'field-value';
    span.textContent = value;

    container.appendChild(checkbox);
    container.appendChild(span);
    td.appendChild(container);
    return td;
}

// Handle Checkbox
function handleCheckboxChange(e) {
    const cb = e.target;
    const field = cb.dataset.field;

    if (cb.checked) {
        selectedFields[field] = { api: cb.dataset.api, value: cb.dataset.value };
    } else {
        delete selectedFields[field];
    }
    updateSummary();
}

// Summary
function updateSummary() {
    const count = Object.keys(selectedFields).length;
    const container = document.getElementById('downloadButtonContainer');
    
    if (count === 0) {
        selectedSummary.innerHTML = '<p class="no-selection">No fields selected yet. Click checkboxes to select data sources.</p>';
        if (container) container.style.display = 'none';
        return;
    }
    
    // Show extract button and its container
    if (container) {
        container.style.display = 'flex';
        container.style.gap = '10px';
        container.style.justifyContent = 'flex-end';
    }
    
    let html = '<div class="selected-fields-list">';
    
    for (const fieldName in selectedFields) {
        const field = selectedFields[fieldName];
        html += `
            <div class="selected-field-item">
                <div class="field-info">
                    <span class="field-name">${fieldName}</span>
                    <span class="field-api">${field.api}</span>
                    <span class="field-value">${field.value}</span>
                </div>
                <button class="btn-remove-field" onclick="removeField('${fieldName}')">Remove</button>
            </div>
        `;
    }
    
    html += '</div>';
    selectedSummary.innerHTML = html;
}

// Remove a field from selection
function removeField(fieldName) {
    delete selectedFields[fieldName];
    
    // Uncheck the corresponding checkbox
    const checkbox = document.querySelector(`input[data-field="${fieldName}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }
    
    updateSummary();
    showSuccess(`Removed: ${fieldName}`);
}

// Clear
function clearAllSelections() {
    document.querySelectorAll('#tableBody input[type="checkbox"]').forEach(cb => cb.checked = false);
    selectedFields = {};
    updateSummary();
    showSuccess('All selections cleared');
}

// ===== API STATISTICS HISTORY FUNCTIONS =====

// Load and display statistics history
async function loadStatisticsHistory() {
    try {
        const response = await fetch('/api/get-statistics-history', {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success && result.history && result.history.length > 0) {
            displayStatisticsHistory(result.history);
            document.getElementById('statisticsHistorySection').classList.remove('hidden');
        } else {
            document.getElementById('statisticsHistorySection').classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading statistics history:', error);
    }
}

// Display statistics history
function displayStatisticsHistory(history) {
    const container = document.getElementById('historyContainer');
    container.innerHTML = '';
    
    history.forEach((record) => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.dataset.recordId = record.id;
        
        card.innerHTML = `
            <div class="history-card-header">
                <div class="history-address">${record.address}</div>
                <button class="btn btn-delete btn-sm" onclick="deleteHistoryRecord(${record.id}, '${record.address}')">Delete</button>
            </div>
            <div class="history-stats-grid">
                <div class="history-stat-box stat-regrid">
                    <div class="history-stat-label">Regrid API</div>
                    <div class="history-stat-values">
                        <span class="stat-available">✓ ${record.regrid.available}</span>
                        <span class="stat-unavailable">✗ ${record.regrid.unavailable}</span>
                        <span class="stat-total">Total: ${record.regrid.total}</span>
                    </div>
                </div>
                <div class="history-stat-box stat-smarty">
                    <div class="history-stat-label">Smarty API</div>
                    <div class="history-stat-values">
                        <span class="stat-available">✓ ${record.smarty.available}</span>
                        <span class="stat-unavailable">✗ ${record.smarty.unavailable}</span>
                        <span class="stat-total">Total: ${record.smarty.total}</span>
                    </div>
                </div>
                <div class="history-stat-box stat-melissa">
                    <div class="history-stat-label">Melissa API</div>
                    <div class="history-stat-values">
                        <span class="stat-available">✓ ${record.melissa.available}</span>
                        <span class="stat-unavailable">✗ ${record.melissa.unavailable}</span>
                        <span class="stat-total">Total: ${record.melissa.total}</span>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Export statistics to Excel
async function exportStatisticsToExcel() {
    try {
        showSuccess('Generating Excel file...');
        
        const response = await fetch('/api/export-statistics-excel', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            showError(error.error || 'Export failed');
            return;
        }
        
        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Get filename from response header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'API_Statistics_History.xlsx';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccess('✓ Excel file downloaded successfully!');
    } catch (error) {
        console.error('Export error:', error);
        showError('Failed to export statistics');
    }
}

// ===== SAVE AND DOWNLOAD FUNCTIONS =====

// Save selected fields to server
async function saveSelection() {
    const selectedCount = Object.keys(selectedFields).length;
    
    if (selectedCount === 0) {
        showError('No fields selected. Please select at least one field.');
        return;
    }
    
    try {
        const response = await fetch('/api/save-selection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selections: selectedFields,
                address: currentAddress
            }),
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            showError(result.error || 'Failed to save selections');
            return;
        }
        
        // Download JSON file
        const jsonData = {
            address: currentAddress,
            timestamp: new Date().toISOString(),
            user_email: 'current_user',
            selected_fields_count: selectedCount,
            fields: selectedFields
        };
        
        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selected_fields_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccess(`✓ Saved ${result.count} fields to JSON file!`);
    } catch (error) {
        console.error('Save error:', error);
        showError('Failed to save selections: ' + error.message);
    }
}

// Show download format modal
function showDownloadOptions() {
    const modal = document.getElementById('downloadModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Close download modal
function closeDownloadModal() {
    const modal = document.getElementById('downloadModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Show extract modal
function showExtractModal() {
    if (Object.keys(selectedFields).length === 0) {
        showError('No fields selected');
        return;
    }
    
    const modal = document.getElementById('extractModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Close extract modal
function closeExtractModal() {
    const modal = document.getElementById('extractModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Confirm extract with selected format
function confirmExtract() {
    const format = document.querySelector('input[name="extractFormat"]:checked').value;
    
    if (!selectedFields || Object.keys(selectedFields).length === 0) {
        showError('No fields selected');
        return;
    }
    
    try {
        closeExtractModal();
        showSuccess(`Extracting in ${format.toUpperCase()} format...`);
        
        if (format === 'json') {
            extractJSON();
        } else if (format === 'csv') {
            extractCSV();
        } else if (format === 'excel') {
            extractExcel();
        }
        
        setTimeout(() => showSuccess(`✓ Extracted ${Object.keys(selectedFields).length} fields!`), 500);
    } catch (error) {
        showError('Extract failed: ' + error.message);
    }
}

// Extract as JSON
function extractJSON() {
    const data = {
        address: currentAddress,
        timestamp: new Date().toISOString(),
        selected_fields_count: Object.keys(selectedFields).length,
        fields: selectedFields
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadFile(blob, `selected_fields_${Date.now()}.json`);
}

// Extract as CSV
function extractCSV() {
    let csv = 'Field Name,API Source,Value\n';
    
    for (const fieldName in selectedFields) {
        const field = selectedFields[fieldName];
        const name = `"${fieldName}"`;
        const api = `"${field.api}"`;
        const value = `"${field.value}"`;
        csv += `${name},${api},${value}\n`;
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `selected_fields_${Date.now()}.csv`);
}

// Extract as Excel
function extractExcel() {
    const data = [];
    
    for (const fieldName in selectedFields) {
        const field = selectedFields[fieldName];
        data.push({
            'Field Name': fieldName,
            'API Source': field.api,
            'Value': field.value
        });
    }
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    worksheet['!cols'] = [
        { wch: 30 },
        { wch: 15 },
        { wch: 40 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Fields');
    XLSX.writeFile(workbook, `selected_fields_${Date.now()}.xlsx`);
}

// Confirm download with selected format
async function confirmDownload() {
    const format = document.querySelector('input[name="downloadFormat"]:checked').value;
    
    if (!currentData || currentData.length === 0) {
        showError('No data to download');
        return;
    }
    
    try {
        closeDownloadModal();
        showSuccess(`Downloading in ${format.toUpperCase()} format...`);
        
        if (format === 'json') {
            downloadJSON();
        } else if (format === 'csv') {
            downloadCSV();
        } else if (format === 'excel') {
            downloadExcel();
        }
        
        setTimeout(() => showSuccess(`✓ Download started!`), 500);
    } catch (error) {
        showError('Download failed: ' + error.message);
    }
}

// Download as JSON
function downloadJSON() {
    const data = {
        address: currentAddress,
        timestamp: new Date().toISOString(),
        fields: currentData
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadFile(blob, `property_data_${Date.now()}.json`);
}

// Download as CSV
function downloadCSV() {
    let csv = 'Field Name,Regrid API,Smarty API,Melissa API\n';
    
    currentData.forEach(row => {
        const field = `"${row.field_name}"`;
        const regrid = `"${row.regrid || ''}"`;
        const smarty = `"${row.smarty || ''}"`;
        const melissa = `"${row.melissa || ''}"`;
        csv += `${field},${regrid},${smarty},${melissa}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `property_data_${Date.now()}.csv`);
}

// Download as Excel
function downloadExcel() {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(currentData);
    
    worksheet['A1'].font = { bold: true, color: 'FFFFFF' };
    worksheet['A1'].fill = { fgColor: { rgb: '667EEA' } };
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Property Data');
    XLSX.writeFile(workbook, `property_data_${Date.now()}.xlsx`);
}

// Helper function to download file
function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Delete a specific history record
async function deleteHistoryRecord(recordId, address) {
    if (!confirm(`Delete history for "${address}"?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/delete-statistics', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ record_id: recordId }),
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            showError(result.error || 'Failed to delete record');
            return;
        }
        
        // Remove card from DOM
        const card = document.querySelector(`[data-record-id="${recordId}"]`);
        if (card) {
            card.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                card.remove();
                // Check if container is empty
                const container = document.getElementById('historyContainer');
                if (container.children.length === 0) {
                    document.getElementById('statisticsHistorySection').classList.add('hidden');
                }
            }, 300);
        }
        
        showSuccess(`✓ Deleted record for "${address}"`);
    } catch (error) {
        console.error('Delete error:', error);
        showError('Failed to delete record: ' + error.message);
    }
}

// ============================================= 
// NOT FOUND POPUP FUNCTIONALITY 
// ============================================= 
function checkAndShowNotFoundPopup(apiStats) {
    const notFoundApis = [];
    
    // Check each API for completely missing data (0 available fields)
    if (apiStats.regrid.available === 0) {
        notFoundApis.push({ name: 'Regrid API', unavailable: apiStats.regrid.unavailable });
    }
    if (apiStats.smarty.available === 0) {
        notFoundApis.push({ name: 'Smarty API', unavailable: apiStats.smarty.unavailable });
    }
    if (apiStats.melissa.available === 0) {
        notFoundApis.push({ name: 'Melissa API', unavailable: apiStats.melissa.unavailable });
    }
    
    // Show popup if any APIs have no data
    if (notFoundApis.length > 0) {
        showNotFoundPopup(notFoundApis, apiStats);
    }
}

function showNotFoundForAPI(apiName) {
    if (!currentApiStats || !currentApiStats[apiName]) {
        return;
    }
    
    const api = currentApiStats[apiName];
    const notFoundApis = [];
    
    if (api.available === 0) {
        const apiNameMap = {
            'regrid': 'Regrid API',
            'smarty': 'Smarty API', 
            'melissa': 'Melissa API'
        };
        
        notFoundApis.push({ 
            name: apiNameMap[apiName], 
            unavailable: api.unavailable 
        });
        
        showNotFoundPopup(notFoundApis, currentApiStats);
    }
}

function showNotFoundPopup(notFoundApis, apiStats) {
    const modal = document.getElementById('notFoundModal');
    const addressSpan = document.getElementById('notFoundAddress');
    const apiList = document.getElementById('notFoundApiList');
    const summaryList = document.getElementById('notFoundSummary');
    
    // Set address
    addressSpan.textContent = currentAddress;
    
    // Clear and populate API list
    apiList.innerHTML = '';
    notFoundApis.forEach(api => {
        const li = document.createElement('li');
        li.textContent = `${api.name} - ${api.unavailable} fields unavailable`;
        apiList.appendChild(li);
    });
    
    // Clear and populate summary
    summaryList.innerHTML = '';
    
    const totalApis = 3;
    const foundApis = totalApis - notFoundApis.length;
    
    const summaryItems = [
        `${notFoundApis.length} API(s) with no data found`,
        `${foundApis} API(s) with data available`,
        `Total APIs checked: ${totalApis}`
    ];
    
    summaryItems.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        summaryList.appendChild(li);
    });
    
    // Show modal
    modal.classList.remove('hidden');
}

function closeNotFoundModal() {
    const modal = document.getElementById('notFoundModal');
    modal.classList.add('hidden');
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('notFoundModal');
    if (event.target === modal) {
        closeNotFoundModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeNotFoundModal();
    }
});

// Add event listener for export button using event delegation
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'exportHistoryBtn') {
        exportStatisticsToExcel();
    }
});
