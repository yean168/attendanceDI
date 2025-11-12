// -----------------------------------------------------------------
// 🔥🔥🔥 បញ្ចូល WEB APP URL របស់អ្នកនៅទីនេះ 🔥🔥🔥
// -----------------------------------------------------------------
const GAS_WEB_APP_URL = "YOUR_WEB_APP_URL_HERE"; 
// ឧទាហរណ៍: "https://script.google.com/macros/s/AKfycbwPk0Lb-e1PtXuE_TSNC9Q5Lound_30AnJnwc5yZ0l8V85wLj7_Rrd4td_g24OjxJHB2w/exec"
// -----------------------------------------------------------------


// --- Global Variables ---
let allReportData = []; // សម្រាប់ផ្ទុកទិន្នន័យដើម
let employeeMasterList = []; // សម្រាប់ផ្ទុកបញ្ជីបុគ្គលិក

// --- DOM Elements ---
const tableBody = document.getElementById('tableBody');
const loader = document.getElementById('loader');
const modal = document.getElementById('formModal');
const closeModalBtn = document.getElementById('closeModal');
const addNewBtn = document.getElementById('addNewBtn');
const form = document.getElementById('reportForm');
const modalTitle = document.getElementById('modalTitle');
const modalLoader = document.getElementById('modalLoader');
const saveBtn = document.getElementById('saveBtn');

// Form Fields
const employeeSelect = document.getElementById('employeeSelect');
const datalist = document.getElementById('employeeDatalist');
const previewBox = document.getElementById('employeePreview');
const reportIdField = document.getElementById('reportId');
const absenceCountField = document.getElementById('absenceCount');
const notesField = document.getElementById('notes');

// Filter Buttons
const filterTodayBtn = document.getElementById('filterToday');
const filterWeekBtn = document.getElementById('filterWeek');
const filterRangeBtn = document.getElementById('filterRange');
const clearFilterBtn = document.getElementById('clearFilter');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    
    // យើងបានលុប 'if' check ចេញពីទីនេះ
    
    // Load initial data
    loadEmployeeMasterList();
    loadReportData();

    // --- Modal Event Listeners ---
    addNewBtn.addEventListener('click', openAddModal); // ឥឡូវនេះ កូដនេះនឹងដំណើរការ
    closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });

    // --- Form Event Listeners ---
    form.addEventListener('submit', handleFormSubmit);
    employeeSelect.addEventListener('input', handleEmployeeSelect);

    // --- Filter Event Listeners ---
    filterTodayBtn.addEventListener('click', filterToday);
    filterWeekBtn.addEventListener('click', filterThisWeek);
    filterRangeBtn.addEventListener('click', filterDateRange);
    clearFilterBtn.addEventListener('click', () => renderTable(allReportData));
});


// --- Data Fetching Functions ---

/**
 * 1. ទាញយកបញ្ជីបុគ្គលិកពី DIList (ដែលមាន "Scan")
 */
async function loadEmployeeMasterList() {
    try {
        const response = await fetch(`${GAS_WEB_APP_URL}?action=getEmployees`);
        const result = await response.json();
        
        if (result.status === 'success') {
            employeeMasterList = result.data;
            populateEmployeeDatalist(employeeMasterList);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading employee list:', error);
        alert('Error loading employee list: ' + error.message);
    }
}

/**
 * 2. ទាញយករបាយការណ៍ដែលបានកត់ត្រាពី sheet1
 */
async function loadReportData() {
    showLoader(true);
    try {
        const response = await fetch(`${GAS_WEB_APP_URL}?action=getReportData`);
        const result = await response.json();

        if (result.status === 'success') {
            allReportData = result.data;
            renderTable(allReportData);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading report data:', error);
        alert('Error loading report data: ' + error.message);
    } finally {
        showLoader(false);
    }
}

/**
 * 3. បញ្ជូនទិន្នន័យ (Create/Update/Delete) ទៅ Apps Script
 */
async function postData(action, payload) {
    showModalLoader(true);
    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            return result.data;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error posting data:', error);
        alert('Error saving data: ' + error.message);
    } finally {
        showModalLoader(false);
    }
}

// --- Rendering Functions ---

/**
 * បង្ហាញទិន្នន័យក្នុងតារាង
 */
function renderTable(data) {
    tableBody.innerHTML = '';
    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 2rem;">មិនមានទិន្នន័យ...</td></tr>`;
        return;
    }

    // Sort by date, newest first
    data.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', row.Report_ID);

        tr.innerHTML = `
            <td>${formatDate(row.Timestamp)}</td>
            <td>${row.Employee_ID}</td>
            <td>${row.Name}</td>
            <td><img src="${row.Photo_URL || 'placeholder.jpg'}" alt="រូបថត" onerror="this.src='https://via.placeholder.com/45?text=No+Img'"></td>
            <td>${row.Gender}</td>
            <td>${row.Group}</td>
            <td>${row.Department}</td>
            <td>${row.Rank}</td>
            <td>${row.Absence_Count}</td>
            <td><div style="max-width: 200px; white-space: pre-wrap; word-break: break-word;">${row.Notes || ''}</div></td>
            <td class="action-buttons">
                <button class="btn btn-warning" onclick="openEditModal('${row.Report_ID}')">✏️ កែប្រែ</button>
                <button class="btn btn-danger" onclick="deleteEntry('${row.Report_ID}')">🗑️ លុប</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

/**
 * បញ្ចូលឈ្មោះបុគ្គលិកទៅក្នុង Datalist
 */
function populateEmployeeDatalist(employees) {
    datalist.innerHTML = '';
    employees.forEach(emp => {
        const option = document.createElement('option');
        // បង្ហាញទាំង ID និង ឈ្មោះ ក្នុង Datalist
        option.value = `${emp.id} - ${emp.name}`;
        datalist.appendChild(option);
    });
}

// --- Form Handling ---

function openAddModal() {
    form.reset();
    reportIdField.value = '';
    modalTitle.textContent = 'បញ្ចូលទិន្នន័យថ្មី';
    previewBox.style.display = 'none';
    employeeSelect.disabled = false;
    modal.style.display = 'block';
}

function openEditModal(reportId) {
    const entry = allReportData.find(row => row.Report_ID === reportId);
    if (!entry) return;

    form.reset();
    
    // Set form values
    reportIdField.value = entry.Report_ID;
    // ស្វែងរកតម្លៃដែលត្រូវគ្នាក្នុង datalist
    const employeeValue = `${entry.Employee_ID} - ${entry.Name}`;
    employeeSelect.value = employeeValue;
    
    absenceCountField.value = entry.Absence_Count;
    notesField.value = entry.Notes;

    // Show preview
    showEmployeePreview(entry.Employee_ID);
    
    // Disable employee selection during edit (or enable if needed)
    employeeSelect.disabled = false; // អនុញ្ញាតឱ្យផ្លាស់ប្តូរបុគ្គលិក
    
    modalTitle.textContent = 'កែប្រែទិន្នន័យ';
    modal.style.display = 'block';
}

/**
 * ដំណើរការនៅពេលជ្រើសរើសបុគ្គលិក
 */
function handleEmployeeSelect() {
    const selectedValue = employeeSelect.value;
    // ទាញយក ID ពី "ID - Name"
    const selectedId = selectedValue.split(' - ')[0]; 
    showEmployeePreview(selectedId);
}

/**
 * បង្ហាញព័ត៌មានបុគ្គលិកនៅពេលជ្រើសរើស
 */
function showEmployeePreview(employeeId) {
    const employee = employeeMasterList.find(emp => emp.id == employeeId);
    
    if (employee) {
        document.getElementById('previewPhoto').src = employee.photo || 'https://via.placeholder.com/80?text=No+Img';
        document.getElementById('previewPhoto').onerror = function() { this.src='https://via.placeholder.com/80?text=No+Img'; };
        document.getElementById('previewId').textContent = employee.id;
        document.getElementById('previewGender').textContent = employee.gender;
        document.getElementById('previewGroup').textContent = employee.group;
        document.getElementById('previewDept').textContent = employee.department;
        document.getElementById('previewRank').textContent = employee.rank;
        previewBox.style.display = 'flex';
    } else {
        previewBox.style.display = 'none';
    }
}

/**
 * ដំណើរការពេល Submit Form (Save)
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const selectedValue = employeeSelect.value;
    const selectedId = selectedValue.split(' - ')[0];
    const employee = employeeMasterList.find(emp => emp.id == selectedId);

    if (!employee) {
        alert('សូមជ្រើសរើសបុគ្គលិកពីក្នុងបញ្ជីឱ្យបានត្រឹមត្រូវ!');
        return;
    }

    const reportId = reportIdField.value;
    
    const payload = {
        Report_ID: reportId, // នឹងនៅទទេ បើជាការបង្កើតថ្មី
        Employee_ID: employee.id,
        Name: employee.name,
        Gender: employee.gender,
        Photo_URL: employee.photo,
        Group: employee.group,
        Department: employee.department,
        Rank: employee.rank,
        Absence_Count: absenceCountField.value,
        Notes: notesField.value
    };

    const action = reportId ? 'updateEntry' : 'createEntry';
    const result = await postData(action, payload);

    if (result) {
        if (action === 'createEntry') {
            // បញ្ចូលទិន្នន័យថ្មីទៅក្នុង array
            allReportData.push(result);
        } else {
            // អាប់ដេតទិន្នន័យចាស់ក្នុង array
            const index = allReportData.findIndex(row => row.Report_ID === reportId);
            if (index !== -1) {
                // អាប់ដេតជាមួយទិន្នន័យថ្មីពី server (រួមទាំង timestamp ដែលអាចមិនផ្លាស់ប្តូរ)
                allReportData[index] = {...allReportData[index], ...payload};
            }
        }
        renderTable(allReportData);
        modal.style.display = 'none';
    }
}

/**
 * ដំណើរការពេលលុបទិន្នន័យ
 */
async function deleteEntry(reportId) {
    if (!confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?')) {
        return;
    }

    const payload = { Report_ID: reportId };
    const result = await postData('deleteEntry', payload);

    if (result && result.status === 'deleted') {
        // លុបចេញពី array
        allReportData = allReportData.filter(row => row.Report_ID !== reportId);
        renderTable(allReportData);
    }
}

// --- Filter Functions ---

function filterToday() {
    const today = new Date();
    const filtered = allReportData.filter(row => {
        const rowDate = new Date(row.Timestamp);
        return rowDate.toDateString() === today.toDateString();
    });
    renderTable(filtered);
}

function filterThisWeek() {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Sunday
    const endOfWeek = new Date(today.setDate(today.getDate() + 6)); // Saturday

    startOfWeek.setHours(0, 0, 0, 0);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const filtered = allReportData.filter(row => {
        const rowDate = new Date(row.Timestamp);
        return rowDate >= startOfWeek && rowDate <= endOfWeek;
    });
    renderTable(filtered);
}

function filterDateRange() {
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    if (!startDateInput.value || !endDateInput.value) {
        alert('សូមជ្រើសរើសថ្ងៃចាប់ផ្តើម និងថ្ងៃបញ្ចប់');
        return;
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const filtered = allReportData.filter(row => {
        const rowDate = new Date(row.Timestamp);
        return rowDate >= startDate && rowDate <= endDate;
    });
    renderTable(filtered);
}


// --- Utility Functions ---

function showLoader(isLoading) {
    loader.style.display = isLoading ? 'block' : 'none';
}

function showModalLoader(isLoading) {
    modalLoader.style.display = isLoading ? 'block' : 'none';
    saveBtn.disabled = isLoading;
}

/**
 * បម្លែង Date ទៅជា Format (12-Nov-2025)
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    
    // ប្រើ en-GB (British English) ដើម្បីបាន format ដូច 12 Nov 2025
    let formatted = new Intl.DateTimeFormat('en-GB', options).format(date);
    
    // ប្តូរ " " ទៅជា "-"
    return formatted.replace(/ /g, '-');
}