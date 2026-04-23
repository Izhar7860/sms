const fs = require('fs');

const htmlPath = 'pages/complaints.html';
let html = fs.readFileSync(htmlPath, 'utf8');

const targetStats = `                <div class="col-md-3">
                    <div class="card text-center stat-card stat-card--complaint">
                        <div class="stat-number text-info" data-complaint-stat="total">28</div>
                        <div class="stat-label">Total Complaints</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center stat-card stat-card--complaint">
                        <div class="stat-number text-warning" data-complaint-stat="pending">8</div>
                        <div class="stat-label">Pending</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center stat-card stat-card--complaint">
                        <div class="stat-number text-primary" data-complaint-stat="inProgress">15</div>
                        <div class="stat-label">In Progress</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center stat-card stat-card--complaint">
                        <div class="stat-number text-success" data-complaint-stat="resolved">5</div>
                        <div class="stat-label">Resolved</div>
                    </div>
                </div>`;

const newStats = `                <div class="col-md-3">
                    <div class="card stat-card h-100 border-0 shadow-sm overflow-hidden position-relative" style="background: linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%); padding-bottom: 1rem;">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm p-3" style="width: 50px; height: 50px;">
                                <i class="fas fa-folder-open fa-lg" style="color: #1976d2;"></i>
                            </div>
                            <div class="stat-label mb-0 fw-medium">Total Complaints</div>
                        </div>
                        <div class="stat-number text-start ms-1" data-complaint-stat="total" style="color: #1565c0; font-size: 2.25rem;">28</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stat-card h-100 border-0 shadow-sm overflow-hidden position-relative" style="background: linear-gradient(135deg, #fff3e0 0%, #ffffff 100%); padding-bottom: 1rem;">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm p-3" style="width: 50px; height: 50px;">
                                <i class="fas fa-clock fa-lg" style="color: #f57c00;"></i>
                            </div>
                            <div class="stat-label mb-0 fw-medium">Pending</div>
                        </div>
                        <div class="stat-number text-start ms-1" data-complaint-stat="pending" style="color: #e65100; font-size: 2.25rem;">8</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stat-card h-100 border-0 shadow-sm overflow-hidden position-relative" style="background: linear-gradient(135deg, #f3e5f5 0%, #ffffff 100%); padding-bottom: 1rem;">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm p-3" style="width: 50px; height: 50px;">
                                <i class="fas fa-spinner fa-spin fa-lg" style="color: #7b1fa2;"></i>
                            </div>
                            <div class="stat-label mb-0 fw-medium">In Progress</div>
                        </div>
                        <div class="stat-number text-start ms-1" data-complaint-stat="inProgress" style="color: #4a148c; font-size: 2.25rem;">15</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stat-card h-100 border-0 shadow-sm overflow-hidden position-relative" style="background: linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%); padding-bottom: 1rem;">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm p-3" style="width: 50px; height: 50px;">
                                <i class="fas fa-check-circle fa-lg" style="color: #2e7d32;"></i>
                            </div>
                            <div class="stat-label mb-0 fw-medium">Resolved</div>
                        </div>
                        <div class="stat-number text-start ms-1" data-complaint-stat="resolved" style="color: #1b5e20; font-size: 2.25rem;">5</div>
                    </div>
                </div>`;

const targetNormalized = targetStats.replace(/\\r\\n/g, '\\n');
html = html.replace(/\\r\\n/g, '\\n');

if (html.includes(targetNormalized)) {
    html = html.replace(targetNormalized, newStats);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('Successfully replaced complaints stats');
} else {
    console.log('Target not found in complaints.html');
}
