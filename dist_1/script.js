document.addEventListener('DOMContentLoaded', () => {
    const operationCalendarDays = document.getElementById('operation-calendar-days');
    
    // Set target month: Default January 2026
    let currentOpYear = 2026;
    let currentOpMonth = 0; // January (0-indexed)
    
    // Define Today and Valid Range
    const today = new Date(2026, 0, 16); // Mock Today: 2026-01-16
    
    // Range: Past 3 months + Current + Future 3 months
    // Base: 2026-01
    // Min: 2025-10
    // Max: 2026-04
    const minDate = new Date(2025, 9, 1); // 2025-10-01
    const maxDate = new Date(2026, 3, 1); // 2026-04-01

    // Plan Settings Data (Weekly: 1=Mon, ..., 0=Sun)
    // Default values based on user description/screenshot
    let planSettings = {
        1: { rows: 3, time: '10:00~18:00' },
        2: { rows: 4, time: '10:00~18:00' },
        3: { rows: 0, time: '10:00~18:00' },
        4: { rows: 0, time: '10:00~19:00' },
        5: { rows: 6, time: '10:00~18:00' },
        6: { rows: 5, time: '10:00~18:00' },
        0: { rows: 5, time: '10:00~18:00' }
    };

    // Daily Plan Overrides (YYYY-MM-DD -> { rows: number, time: string })
    let dailyPlanOverrides = {};

    // Modification Records
    let modificationRecords = [
        { time: '2026-02-05 14:30', user: '张三', content: '调整了2026年1月周五的排班' }
    ];

    // Current Settings View Month
    let currentSettingsMonth = '2026-01';

    // Opening Method Configuration
    let openingMethodConfig = {
        defaultReleaseRate: 60,
        stepRules: [
            { releaseRate: 100, daysBefore: 30, reservationCondition: 'unlimited' }
        ]
    };

    // Product Limiting Rules Mock Data
    // Date -> [Rule1, Rule2]
    const productLimitingRules = {
        '2026-01-20': ['证件限流'],
        '2026-01-21': ['证件限流', '结婚登记限流'],
        '2026-01-24': ['纯拍证件限流']
    };

    // --- Toast Notification Logic ---
    function showToast(message) {
        let toast = document.querySelector('.toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
        }
        
        toast.innerText = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // --- Tab Switching (Modified for separate pages) ---
    function setupTabSwitching() {
        console.log('Setting up tab switching...');
        const tabOperation = document.getElementById('tab-operation-calendar');
        const tabProduct = document.getElementById('tab-product-limiting');
        const tabCity = document.getElementById('tab-city-plan');

        const viewOperation = document.getElementById('operation-calendar-view');
        const viewCity = document.getElementById('city-plan-view');

        // Check which page we are on
        const isCityPlanPage = !!document.getElementById('city-plan-view');
        const isOperationPage = !!document.getElementById('operation-calendar-view');

        if (isOperationPage) {
            // Logic for Operation Calendar Page
            function switchOpTab(tabId) {
        // Only toggle between Operation and Product if they exist
         if (tabId === 'tab-operation-calendar') {
            if(tabOperation) tabOperation.classList.add('active');
            if(tabProduct) tabProduct.classList.remove('active');
            // Show View (Assuming Product Limiting View is not implemented in this demo, just hiding operation)
            if(viewOperation) viewOperation.style.display = 'flex';
            renderWeekdayHeaders();
            renderOperationCalendar(currentOpYear, currentOpMonth);
            updateOpCalendarMonthDisplay();
        } else if (tabId === 'tab-product-limiting') {
                    if(tabOperation) tabOperation.classList.remove('active');
                    if(tabProduct) tabProduct.classList.add('active');
                    // Hide View
                    if(viewOperation) viewOperation.style.display = 'none';
                    // Show Product View if existed
                }
            }

            if(tabOperation) tabOperation.addEventListener('click', () => switchOpTab('tab-operation-calendar'));
            if(tabProduct) tabProduct.addEventListener('click', () => switchOpTab('tab-product-limiting'));
            
            // Initial Render
            renderWeekdayHeaders();
            renderOperationCalendar(currentOpYear, currentOpMonth);
            updateOpCalendarMonthDisplay();
        }

        if (isCityPlanPage) {
            // Logic for City Plan Page
            // No tab switching needed as there is only one tab active
            if(viewCity) {
                viewCity.style.display = 'flex';
                // renderCityPlanTable(); // Moved to end of script
            }
        }
    }
    // setupTabSwitching(); // Moved to end of script

    // Initialize (Conditional)
    // Moved inside setupTabSwitching logic or handled below
    // renderDataPanel();

    // --- Helper Functions ---
    function getPlanForDate(dateStr) {
        // 1. Check for Override
        if (dailyPlanOverrides[dateStr]) {
            return dailyPlanOverrides[dateStr];
        }
        
        // 2. Fallback to Weekly Default
        const date = new Date(dateStr);
        const day = date.getDay(); // 0-6
        return planSettings[day];
    }
    
    // Month Navigation Logic
    const btnOpPrev = document.getElementById('btn-op-prev');
    const btnOpNext = document.getElementById('btn-op-next');
    const btnOpCurrent = document.getElementById('btn-op-current');
    const opCalendarTitle = document.getElementById('op-calendar-title');

    function updateOpCalendarMonthDisplay() {
        if (opCalendarTitle) {
            opCalendarTitle.innerText = `${currentOpYear}年${currentOpMonth + 1}月`;
        }
        
        // Update Buttons State
        const current = new Date(currentOpYear, currentOpMonth, 1);
        
        // Check Prev Limit
        // If current <= minDate, disable prev
        if (current <= minDate) {
            if(btnOpPrev) {
                btnOpPrev.disabled = true;
                btnOpPrev.style.opacity = '0.5';
                btnOpPrev.style.cursor = 'not-allowed';
            }
        } else {
             if(btnOpPrev) {
                btnOpPrev.disabled = false;
                btnOpPrev.style.opacity = '1';
                btnOpPrev.style.cursor = 'pointer';
             }
        }

        // Check Next Limit
        // If current >= maxDate, disable next
        if (current >= maxDate) {
            if(btnOpNext) {
                btnOpNext.disabled = true;
                btnOpNext.style.opacity = '0.5';
                btnOpNext.style.cursor = 'not-allowed';
            }
        } else {
            if(btnOpNext) {
                btnOpNext.disabled = false;
                btnOpNext.style.opacity = '1';
                btnOpNext.style.cursor = 'pointer';
            }
        }

        renderOperationCalendar(currentOpYear, currentOpMonth);
    }

    if(btnOpPrev) {
        btnOpPrev.onclick = () => {
            currentOpMonth--;
            if (currentOpMonth < 0) {
                currentOpMonth = 11;
                currentOpYear--;
            }
            updateOpCalendarMonthDisplay();
        };
    }

    if(btnOpNext) {
        btnOpNext.onclick = () => {
            currentOpMonth++;
            if (currentOpMonth > 11) {
                currentOpMonth = 0;
                currentOpYear++;
            }
            updateOpCalendarMonthDisplay();
        };
    }

    if(btnOpCurrent) {
        btnOpCurrent.onclick = () => {
            currentOpYear = 2026;
            currentOpMonth = 0;
            updateOpCalendarMonthDisplay();
        };
    }

    let currentActiveStore = null;

    function renderWeekdayHeaders() {
        const headers = document.querySelectorAll('.weekday-header');
        // HTML Order: Mon, Tue, Wed, Thu, Fri, Sat, Sun
        // Map to keys: 1, 2, 3, 4, 5, 6, 0
        const order = [1, 2, 3, 4, 5, 6, 0];
        const names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

        headers.forEach((header, index) => {
            const key = order[index];
            const name = names[index];
            
            // Rebuild content - Simplified
            header.innerHTML = `
                <div style="font-size: 14px; font-weight: 500; display: flex; align-items: center; justify-content: center;">
                    ${name}
                </div>
            `;
            
            // Remove batch edit interaction
            header.style.cursor = 'default';
            header.title = '';
            header.onclick = null;
            });
    }

    // --- Daily Plan Edit Modal Logic Removed ---

    // --- Batch Plan Modal Logic ---
    const batchPlanModal = document.getElementById('batch-plan-modal');
    const closeBatchPlanBtns = document.querySelectorAll('.close-batch-plan');
    const btnSaveBatchPlan = document.getElementById('btn-save-batch-plan');
    let currentBatchWeekday = null; // 0-6

    // Note: openBatchEditModal is removed as per requirement "Remove batch entry from weekday grid"
    // But we need the modal for the new "Plan Settings" tab batch operation.

    closeBatchPlanBtns.forEach(btn => {
        btn.onclick = () => batchPlanModal.style.display = 'none';
    });

    btnSaveBatchPlan.onclick = () => {
        if (currentBatchWeekday === null) return;

        const newRows = parseInt(document.getElementById('batch-plan-rows').value) || 0;
        const newTime = document.getElementById('batch-plan-time').value;
        const overwrite = document.getElementById('batch-plan-overwrite').checked;

        // Apply to all future dates of this weekday in current month
        const daysInMonth = new Date(currentOpYear, currentOpMonth + 1, 0).getDate();
        
        let updateCount = 0;
        
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(currentOpYear, currentOpMonth, d);
            if (date.getDay() === currentBatchWeekday) {
                // Check if date is in past (using global 'today')
                if (date.getTime() < today.getTime()) continue;

                const dateStr = `${currentOpYear}-${String(currentOpMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                
                if (!overwrite && dailyPlanOverrides[dateStr]) {
                    continue; 
                }

                dailyPlanOverrides[dateStr] = {
                    rows: newRows,
                    time: newTime
                };
                updateCount++;
            }
        }

        alert('批量修改已应用');
        batchPlanModal.style.display = 'none';
        renderOperationCalendar(currentOpYear, currentOpMonth);
    };

    function renderOperationCalendar(year, month) {
        operationCalendarDays.innerHTML = '';
        
        // Stats for Weekday Averages (Plan Reservation Rate)
        // 0=Sun, 1=Mon, ..., 6=Sat
        const weekdayStats = {
            0: { totalPlan: 0, totalReserved: 0 },
            1: { totalPlan: 0, totalReserved: 0 },
            2: { totalPlan: 0, totalReserved: 0 },
            3: { totalPlan: 0, totalReserved: 0 },
            4: { totalPlan: 0, totalReserved: 0 },
            5: { totalPlan: 0, totalReserved: 0 },
            6: { totalPlan: 0, totalReserved: 0 }
        };

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();
        
        let startDay = firstDay.getDay(); 
        startDay = startDay === 0 ? 6 : startDay - 1; // Adjust to Mon=0 start

        // --- Calculate View Max Capacity ---
        // Iterate through all days in current month to find the maximum plan spots
        let viewMaxPlanSpots = 0;
        
        for (let i = 1; i <= totalDays; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const currentCellDate = new Date(year, month, i);
            const weekday = currentCellDate.getDay();
            const plan = getPlanForDate(dateStr);
            if (plan) {
                const spots = plan.rows * 60;
                if (spots > viewMaxPlanSpots) viewMaxPlanSpots = spots;
            }
        }
        
        // Set a reasonable minimum baseline to avoid extreme sensitivity for very small stores
        // e.g. if max is 0 (unconfigured), use default 500
        // if max is small (e.g. 30), use it (or slightly larger buffer)
        // Let's use max(viewMax, 100) to prevent div/0 or too small bars
        const dynamicMaxCapacity = Math.max(viewMaxPlanSpots, 100);

        // Previous month filler
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = 0; i < startDay; i++) {
            const dayNum = prevMonthLastDay - startDay + 1 + i;
            operationCalendarDays.appendChild(createDayCell(dayNum, true));
        }

        // Current month
        for (let i = 1; i <= totalDays; i++) {
            const currentCellDate = new Date(year, month, i);
            const weekday = currentCellDate.getDay();
            const cell = createDayCell(i, false);
            
            // Mark today
            const isToday = currentCellDate.getTime() === today.getTime();
            const isPast = currentCellDate.getTime() < today.getTime();
            
            if (isToday) {
                cell.classList.add('today');
            }
            
            // Render Info
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const metrics = renderCellInfo(cell, weekday, dateStr, dynamicMaxCapacity);
            
            // Accumulate Stats for Past Dates
            if (isPast && metrics) {
                weekdayStats[weekday].totalPlan += metrics.planSpots;
                weekdayStats[weekday].totalReserved += metrics.reservedSpots;
            }
            
            operationCalendarDays.appendChild(cell);
        }

        // Next month filler
        const totalCells = startDay + totalDays;
        const remainingCells = (totalCells % 7 === 0) ? 0 : 7 - (totalCells % 7);
        const extraCells = (Math.ceil((totalCells + remainingCells) / 7) * 7) - totalCells;

        for (let i = 1; i <= extraCells; i++) {
            operationCalendarDays.appendChild(createDayCell(i, true));
        }
    }

    function createDayCell(dayNumber, isOtherMonth) {
        const div = document.createElement('div');
        let className = 'day-cell';
        if (isOtherMonth) className += ' other-month';
        div.className = className;
        
        const header = document.createElement('div');
        header.className = 'day-header';

        const numberSpan = document.createElement('span');
        numberSpan.className = 'day-number';
        numberSpan.innerText = dayNumber;
        
        header.appendChild(numberSpan);

        // Add "自动开点" tag to cell if applicable
        if (!isOtherMonth && currentActiveStore && currentActiveStore.autoOpenEnabled && currentActiveStore.recoveryDays) {
            // Get date object to determine weekday
            const date = new Date(currentOpYear, currentOpMonth, dayNumber);
            const weekday = date.getDay();
            
            if (currentActiveStore.recoveryDays.includes(weekday)) {
                const unifiedTag = document.createElement('span');
                unifiedTag.innerText = '自动开点';
                unifiedTag.style.cssText = 'margin-left: 6px; font-size: 10px; color: #52c41a; background: #f6ffed; border: 1px solid #b7eb8f; padding: 0 4px; border-radius: 2px; line-height: 1.4; display: inline-block; vertical-align: middle;';
                header.appendChild(unifiedTag);
            }
        }

        div.appendChild(header);

        return div;
    }

    function renderCellInfo(cell, weekday, dateStr, maxCapacity = 500) {
        // 1. Get Plan Config (Use Override if available)
        const plan = dateStr ? getPlanForDate(dateStr) : planSettings[weekday];
        if (!plan) return;

        // 2. Calculate Metrics
        // Plan Spots (Convention: 60 spots per row based on screenshot)
        const planSpots = plan.rows * 60;
        
        // Open Spots (Mock Data)
        // Simulate variation: +/- 20% of plan
        // If plan is 0, use a fallback base (e.g. 240) to generate mock Actual/Reservation data
        const baseForMock = planSpots > 0 ? planSpots : 240;
        const openSpots = Math.floor(baseForMock * (0.8 + Math.random() * 0.4));
        
        // Release Rate = Open / Plan
        const releaseRate = planSpots > 0 ? Math.round((openSpots / planSpots) * 100) : 0;
        
        // Reserved Spots (Mock Data)
        // Cannot exceed open spots. Simulate 40-95% occupancy to allow for "Insufficient" (<60%) cases.
        const reservedSpots = Math.floor(openSpots * (0.4 + Math.random() * 0.55));
        
        // Reservation Rate = Reserved / Open
        const reservationRate = openSpots > 0 ? Math.round((reservedSpots / openSpots) * 100) : 0;

        // 2. Determine Styles for Progress Bars
        // Reservation Rate Logic (<60, 60-80, 80-100, >100)
        function getReservationBarClass(rate) {
            if (rate < 60) return 'bar-level-1';      // < 60%
            if (rate < 80) return 'bar-level-2';      // 60-79%
            if (rate <= 100) return 'bar-level-3';    // 80-100%
            return 'bar-level-4';                     // > 100%
        }

        // Release Rate Logic (<60, 60-90, 90-110, >110)
        function getReleaseBarClass(rate, planSpots) {
            // If Plan Spots is 0 or undefined, default to healthy green (Level 3)
            // This prevents "yellow/red" warning when there was no plan to begin with.
            if (!planSpots || planSpots === 0) return 'bar-level-3';

            if (rate < 60) return 'bar-level-1';      // < 60%
            if (rate < 90) return 'bar-level-2';      // 60-89%
            if (rate <= 110) return 'bar-level-3';    // 90-110%
            return 'bar-level-4';                     // > 110%
        }

        const releaseClass = getReleaseBarClass(releaseRate, planSpots);
        const reservationClass = getReservationBarClass(reservationRate);

        // Progress bars visual limits
        // Suggestion bar length relative to dynamicMaxCapacity
        const suggestionVisualPercent = Math.min(100, Math.max(0, (planSpots / maxCapacity) * 100));
        
        // Actual Opening bar length relative to dynamicMaxCapacity
        const releaseVisualPercent = Math.min(100, (openSpots / maxCapacity) * 100);
        
        // Reservation bar length relative to dynamicMaxCapacity
        const reservationVisualPercent = Math.min(100, (reservedSpots / maxCapacity) * 100);

        // 4. Build HTML Structure
        const infoDiv = document.createElement('div');
        infoDiv.className = 'schedule-info';
        
        // Requirement: Remove Daily Diagnosis Tags
        const header = cell.querySelector('.day-header');
        if (header) {
             const existingTag = header.querySelector('.diagnosis-tag');
             if (existingTag) existingTag.remove();
        }
        
        // Line 1: Plan (Context) -> "目标" (Target)
        // Add Edit Interaction
        const planLine = document.createElement('div');
        planLine.className = 'cell-line plan-line';
        
        // Using Level 3 color (#13c2c2) for target
        // Increased contrast for text color: using a darker teal #006d75 instead of #13c2c2
        planLine.innerHTML = `
            <span>目标</span>
            <div class="progress-container">
                 <div class="progress-bar" style="width: ${suggestionVisualPercent}%; background-color: #13c2c2;"></div>
                 <div class="progress-text" style="color: #006d75; font-weight: 600;">${planSpots > 0 ? planSpots : ''}</div>
            </div>
        `;
        if (dateStr) {
            planLine.onclick = (e) => {
                e.stopPropagation(); // Prevent bubbling if needed
                openDailyEditModal(dateStr);
            };
            planLine.title = "点击修改当日目标";
            planLine.style.cursor = "pointer";
        }
        infoDiv.appendChild(planLine);

        // Line 2: Opening -> "实开" (Actual Opening)
        const openingLine = document.createElement('div');
        openingLine.className = 'cell-line';
        
        // Logic: Show rate only if planSpots > 0
        const openingRateHtml = planSpots > 0 ? `(${releaseRate}%)` : '';
        
        openingLine.innerHTML = `
            <span>实开</span>
            <div class="progress-container">
                <div class="progress-bar ${releaseClass}" style="width: ${releaseVisualPercent}%"></div>
                <div class="progress-text">${openSpots} ${openingRateHtml}</div>
            </div>
        `;
        infoDiv.appendChild(openingLine);

        // Line 3: Reservation
        const reservationLine = document.createElement('div');
        reservationLine.className = 'cell-line';
        
        // Logic: Show rate only if openSpots > 0
        const reservationRateHtml = openSpots > 0 ? `(${reservationRate}%)` : '';
        
        reservationLine.innerHTML = `
            <span>预约</span>
            <div class="progress-container">
                <div class="progress-bar ${reservationClass}" style="width: ${reservationVisualPercent}%"></div>
                <div class="progress-text">${reservedSpots} ${reservationRateHtml}</div>
            </div>
        `;
        infoDiv.appendChild(reservationLine);

        // Product Limiting Tags (Moved to bottom)
        if (dateStr && productLimitingRules[dateStr]) {
            const rules = productLimitingRules[dateStr];
            const tagsContainer = document.createElement('div');
            tagsContainer.style.marginTop = '4px';
            tagsContainer.style.display = 'flex';
            tagsContainer.style.flexWrap = 'wrap';
            tagsContainer.style.gap = '4px';
            
            rules.forEach(rule => {
                const tag = document.createElement('span');
                tag.innerText = rule;
                tag.style.fontSize = '10px';
                tag.style.color = '#722ed1';
                tag.style.backgroundColor = '#f9f0ff';
                tag.style.border = '1px solid #d3adf7';
                tag.style.padding = '0 4px';
                tag.style.borderRadius = '2px';
                tagsContainer.appendChild(tag);
            });
            infoDiv.appendChild(tagsContainer);
        }

        cell.appendChild(infoDiv);
        
        return { planSpots, reservedSpots }; // Return metrics for stats collection
    }



    // --- City Plan Logic ---
    let currentCityMonth = '2026-02'; // Default to current month

    // Updated City Stores Data to support {rows, time} object
    const cityStores = [
        { 
            id: 1, 
            name: '杭州湖滨银泰in77店', 
            strategy: '拍前30天全开', 
            release: 100, 
            plan: { 1: {rows:3, time:'10:00~18:00'}, 2: {rows:4, time:'10:00~18:00'}, 3: {rows:4, time:'10:00~18:00'}, 4: {rows:6, time:'10:00~19:00'}, 5: {rows:6, time:'10:00~18:00'}, 6: {rows:5, time:'10:00~18:00'}, 0: {rows:5, time:'10:00~18:00'} },
            // 1. Auto Open ON, Adjustment 7 days, Weekends, Spring Festival
            farTermEnabled: true,
            autoOpenEnabled: true,
            recoveryDays: [6, 0],
            activityCycles: ['spring_festival'],
            adjustmentDays: 7,
            storeVolume: 'A30' // Default volume
        },
        { 
            id: 2, 
            name: '杭州城西银泰店', 
            strategy: '拍前30天全开', 
            release: 100, 
            plan: { 1: {rows:3, time:'10:00~18:00'}, 2: {rows:4, time:'10:00~18:00'}, 3: {rows:4, time:'10:00~18:00'}, 4: {rows:6, time:'10:00~19:00'}, 5: {rows:6, time:'10:00~18:00'}, 6: {rows:5, time:'10:00~18:00'}, 0: {rows:5, time:'10:00~18:00'} },
            // 2. Auto Open ON, Adjustment 3 days, Mon-Fri, No Activity
            farTermEnabled: true,
            autoOpenEnabled: true,
            recoveryDays: [1, 2, 3, 4, 5],
            activityCycles: [],
            adjustmentDays: 3,
            storeVolume: 'B30'
        },
        { 
            id: 3, 
            name: '杭州龙湖金沙天街店', 
            strategy: '拍前30天全开', 
            release: 80, 
            plan: { 1: {rows:3, time:'10:00~18:00'}, 2: {rows:4, time:'10:00~18:00'}, 3: {rows:4, time:'10:00~18:00'}, 4: {rows:6, time:'10:00~19:00'}, 5: {rows:6, time:'10:00~18:00'}, 6: {rows:5, time:'10:00~18:00'}, 0: {rows:5, time:'10:00~18:00'} },
            // 3. Auto Open ON, Adjustment Disabled, All Days, Multiple Activities
            farTermEnabled: true,
            autoOpenEnabled: true,
            recoveryDays: [1, 2, 3, 4, 5, 6, 0],
            activityCycles: ['national_day', 'double_11'],
            adjustmentDays: null,
            storeVolume: 'A40'
        },
        { 
            id: 4, 
            name: '杭州远洋乐堤港店', 
            strategy: '拍前30天全开', 
            release: 100, 
            plan: { 1: {rows:3, time:'10:00~18:00'}, 2: {rows:4, time:'10:00~18:00'}, 3: {rows:4, time:'10:00~18:00'}, 4: {rows:6, time:'10:00~19:00'}, 5: {rows:6, time:'10:00~18:00'}, 6: {rows:5, time:'10:00~18:00'}, 0: {rows:5, time:'10:00~18:00'} },
            // 4. Auto Open OFF (Manual), Far-term ON
            farTermEnabled: true,
            autoOpenEnabled: false,
            storeVolume: 'B40'
        },
        { 
            id: 5, 
            name: '杭州龙湖滨江天街店', 
            strategy: '拍前30天全开', 
            release: 100, 
            plan: { 1: {rows:3, time:'10:00~18:00'}, 2: {rows:4, time:'10:00~18:00'}, 3: {rows:4, time:'10:00~18:00'}, 4: {rows:6, time:'10:00~19:00'}, 5: {rows:6, time:'10:00~18:00'}, 6: {rows:5, time:'10:00~18:00'}, 0: {rows:5, time:'10:00~18:00'} },
            // 5. Far-term OFF, Auto Open OFF
            farTermEnabled: false,
            autoOpenEnabled: false,
            storeVolume: 'A50'
        },
        { id: 6, name: '杭州平银泰城店', strategy: '拍前30天全开', release: 100, plan: { 1: {rows:3, time:'10:00~18:00'}, 2: {rows:4, time:'10:00~18:00'}, 3: {rows:4, time:'10:00~18:00'}, 4: {rows:6, time:'10:00~19:00'}, 5: {rows:6, time:'10:00~18:00'}, 6: {rows:5, time:'10:00~18:00'}, 0: {rows:5, time:'10:00~18:00'} } },
        { id: 7, name: '杭州萧山万象汇店', strategy: null, release: 0, plan: { 1: {rows:0, time:''}, 2: {rows:0, time:''}, 3: {rows:0, time:''}, 4: {rows:0, time:''}, 5: {rows:0, time:''}, 6: {rows:0, time:''}, 0: {rows:0, time:''} } },
        { id: 8, name: '杭州西溪印象城店', strategy: '拍前30天全开', release: 100, plan: { 1: {rows:3, time:'10:00~18:00'}, 2: {rows:4, time:'10:00~18:00'}, 3: {rows:4, time:'10:00~18:00'}, 4: {rows:6, time:'10:00~19:00'}, 5: {rows:6, time:'10:00~18:00'}, 6: {rows:5, time:'10:00~18:00'}, 0: {rows:5, time:'10:00~18:00'} } },
        { id: 9, name: '杭州黄龙万科中心店', strategy: '拍前30天全开', release: 100, plan: { 1: {rows:3, time:'10:00~18:00'}, 2: {rows:4, time:'10:00~18:00'}, 3: {rows:4, time:'10:00~18:00'}, 4: {rows:6, time:'10:00~19:00'}, 5: {rows:6, time:'10:00~18:00'}, 6: {rows:5, time:'10:00~18:00'}, 0: {rows:5, time:'10:00~18:00'} } },
        { id: 10, name: '杭州西湖银泰店', strategy: '拍前30天全开', release: 100, plan: { 1: {rows:3, time:'10:00~18:00'}, 2: {rows:4, time:'10:00~18:00'}, 3: {rows:4, time:'10:00~18:00'}, 4: {rows:6, time:'10:00~19:00'}, 5: {rows:6, time:'10:00~18:00'}, 6: {rows:5, time:'10:00~18:00'}, 0: {rows:5, time:'10:00~18:00'} } },
        { id: 11, name: '杭州金沙印象城店', strategy: '拍前30天全开', release: 100, plan: { 1: {rows:3, time:'10:00~18:00'}, 2: {rows:4, time:'10:00~18:00'}, 3: {rows:4, time:'10:00~18:00'}, 4: {rows:6, time:'10:00~19:00'}, 5: {rows:6, time:'10:00~18:00'}, 6: {rows:5, time:'10:00~18:00'}, 0: {rows:5, time:'10:00~18:00'} } },
        { id: 12, name: '杭州东站万象汇店', strategy: '拍前30天全开', release: 100, plan: { 1: {rows:3, time:'10:00~18:00'}, 2: {rows:4, time:'10:00~18:00'}, 3: {rows:4, time:'10:00~18:00'}, 4: {rows:6, time:'10:00~19:00'}, 5: {rows:6, time:'10:00~18:00'}, 6: {rows:5, time:'10:00~18:00'}, 0: {rows:5, time:'10:00~18:00'} } },
        { id: 1001, name: '国贸旗舰店', strategy: '拍前30天全开', release: 100, plan: { 1: {rows:5, time:'10:00~22:00'}, 2: {rows:5, time:'10:00~22:00'}, 3: {rows:5, time:'10:00~22:00'}, 4: {rows:6, time:'10:00~22:00'}, 5: {rows:8, time:'10:00~22:00'}, 6: {rows:10, time:'10:00~22:00'}, 0: {rows:10, time:'10:00~22:00'} } },
        { id: 1002, name: '三里屯概念店', strategy: '拍前30天全开', release: 100, plan: { 1: {rows:4, time:'10:00~22:00'}, 2: {rows:4, time:'10:00~22:00'}, 3: {rows:4, time:'10:00~22:00'}, 4: {rows:5, time:'10:00~22:00'}, 5: {rows:6, time:'10:00~22:00'}, 6: {rows:8, time:'10:00~22:00'}, 0: {rows:8, time:'10:00~22:00'} } },
        { id: 1003, name: '朝阳大悦城店', strategy: '拍前30天全开', release: 80, plan: { 1: {rows:3, time:'10:00~22:00'}, 2: {rows:3, time:'10:00~22:00'}, 3: {rows:3, time:'10:00~22:00'}, 4: {rows:4, time:'10:00~22:00'}, 5: {rows:5, time:'10:00~22:00'}, 6: {rows:7, time:'10:00~22:00'}, 0: {rows:7, time:'10:00~22:00'} } },
        { id: 1004, name: '西单主力店', strategy: '拍前30天全开', release: 100, plan: { 1: {rows:4, time:'10:00~22:00'}, 2: {rows:4, time:'10:00~22:00'}, 3: {rows:4, time:'10:00~22:00'}, 4: {rows:5, time:'10:00~22:00'}, 5: {rows:6, time:'10:00~22:00'}, 6: {rows:8, time:'10:00~22:00'}, 0: {rows:8, time:'10:00~22:00'} } }
    ];

    // renderCityPlanHeaders Removed


    function renderCityPlanTable() {
        const tbody = document.getElementById('city-plan-tbody-static');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        cityStores.forEach(store => {
            // Initialize defaults if missing
            if (typeof store.farTermEnabled === 'undefined') store.farTermEnabled = true;
            if (typeof store.autoOpenEnabled === 'undefined') store.autoOpenEnabled = false;
            if (typeof store.recoveryDays === 'undefined') store.recoveryDays = [6, 0];
            if (typeof store.activityCycles === 'undefined') store.activityCycles = [];
            if (typeof store.adjustmentDays === 'undefined') store.adjustmentDays = 7;

            // 1. Far-term Basic Spots (Status)
            let farTermStatus = '';
            if (store.autoOpenEnabled) { // Use autoOpenEnabled as the primary switch for "自动开点"
                farTermStatus = `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                        <span class="tag tag-success" style="background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; padding: 2px 8px; border-radius: 4px; font-size: 12px;">自动开点</span>
                    </div>
                `;
            } else {
                farTermStatus = '<span class="tag tag-default" style="background: #f5f5f5; color: #d9d9d9; border: 1px solid #d9d9d9; padding: 2px 8px; border-radius: 4px; font-size: 12px;">手动</span>';
            }

            // 2. Long-term Target Spots (Status & Details)
            let longTermContent = '';
            if (store.autoOpenEnabled) {
                const weekMap = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 0: '周日' };
                const daysText = store.recoveryDays.map(d => weekMap[d]).join('、');
                
                const activityMap = {
                    'spring_festival': '春节不打烊',
                    'national_day': '国庆黄金周',
                    'double_11': '双11大促',
                    'christmas': '圣诞狂欢'
                };
                let activitiesText = store.activityCycles.map(a => activityMap[a]).join('、');
                
                longTermContent = `
                    <div style="text-align: left; font-size: 12px; line-height: 1.5;">
                        <div style="margin-bottom: 4px;">
                            <span class="tag tag-success" style="background: #e6f7ff; color: #1890ff; border: 1px solid #91d5ff; padding: 0 4px; border-radius: 2px; margin-right: 4px;">自动开点</span>
                        </div>
                        <div style="color: #666;">应用日期: ${daysText || '-'}</div>
                        <div style="color: #666;">应用活动: ${activitiesText || '-'}</div>
                    </div>
                `;
            } else {
                longTermContent = '-';
            }

            // 3. Store Adjustable (Status)
            let adjustmentContent = '';
            if (store.autoOpenEnabled) {
                if (store.adjustmentDays !== null) {
                    adjustmentContent = `<span style="color: #333;">拍前 ${store.adjustmentDays} 天</span>`;
                } else {
                    adjustmentContent = '<span style="color: #999;">不支持调节</span>';
                }
            } else {
                adjustmentContent = '-';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: left;">${String(store.id).padStart(4, '0')}</td>
                <td style="text-align: left;">${store.name}</td>
                <td style="text-align: center;">${store.storeVolume ? `<span style="font-size: 12px; color: #666; background: #f0f2f5; padding: 2px 6px; border-radius: 2px;">${store.storeVolume}</span>` : '-'}</td>
                <td style="text-align: center;">${farTermStatus}</td>
                <td style="text-align: center;">${longTermContent}</td>
                <td style="text-align: center;">${adjustmentContent}</td>
                <td style="text-align: center;">
                    <button class="btn-secondary btn-sm" onclick="openStoreEditModal(${store.id})" style="padding: 4px 8px; border: 1px solid #d9d9d9; background: #fff; border-radius: 4px; cursor: pointer;">高级设置</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    // City Month Switcher Logic
    const btnCityPrev = document.getElementById('btn-city-prev-month');
    const btnCityNext = document.getElementById('btn-city-next-month');
    const btnCityCurrent = document.getElementById('btn-city-current-month');

    function updateCityMonthDisplay() {
        if(btnCityCurrent) btnCityCurrent.innerText = currentCityMonth;
        renderCityPlanTable(); // In real app, this would fetch data for new month
    }

    if(btnCityPrev) {
        btnCityPrev.onclick = () => {
            let [y, m] = currentCityMonth.split('-').map(Number);
            m--;
            if(m < 1) { m = 12; y--; }
            currentCityMonth = `${y}-${String(m).padStart(2, '0')}`;
            updateCityMonthDisplay();
        };
    }

    if(btnCityNext) {
        btnCityNext.onclick = () => {
            let [y, m] = currentCityMonth.split('-').map(Number);
            m++;
            if(m > 12) { m = 1; y++; }
            currentCityMonth = `${y}-${String(m).padStart(2, '0')}`;
            updateCityMonthDisplay();
        };
    }

    // City Plan Save Logic
    const btnSaveCityPlan = document.getElementById('btn-save-city-plan');
    if (btnSaveCityPlan) {
        btnSaveCityPlan.onclick = () => {
            const inputs = document.querySelectorAll('.city-plan-input');
            let updatedCount = 0;
            inputs.forEach(input => {
                const id = parseInt(input.getAttribute('data-id'));
                const day = parseInt(input.getAttribute('data-day'));
                const val = parseInt(input.value) || 0;
                
                const store = cityStores.find(s => s.id === id);
                if (store) {
                    if (store.plan[day] !== val) {
                        store.plan[day] = val;
                        updatedCount++;
                    }
                }
            });

            if (updatedCount > 0) {
                alert(`保存成功！已更新 ${updatedCount} 项排班数据。`);
                renderCityPlanTable(); // Re-render to update status tags
            } else {
                alert('保存成功！没有检测到数据变更。');
            }
        };
    }

    // City Batch Modal Logic Removed (Button and Checkboxes removed)

    function renderCityBatchContent() {
        const container = document.getElementById('city-batch-modal-body');
        if(!container) return;
        
        // Reuse similar structure to Plan Settings Page
        // 1. Opening Method (Simplified)
        // 2. Weekly Template (Init Plan)
        
        container.innerHTML = `
            <div class="settings-card">
                <div class="settings-section-title">1. 统一开点策略</div>
                 <div class="form-group">
                    <label>默认放量：</label>
                    <div class="input-suffix-group">
                        <input type="number" class="edit-input" value="100" style="width: 80px;">
                        <span>%</span>
                    </div>
                </div>
                <div style="background: #f9f9f9; padding: 10px; border-radius: 4px; margin-top: 15px;">
                    <div style="font-weight: 500; margin-bottom: 8px;">推荐策略：拍前30天全开</div>
                    <div style="font-size: 12px; color: #999;">* 将应用到所有选中门店</div>
                </div>
            </div>

            <div class="settings-card">
                 <div class="settings-section-title">2. 统一排班模板 (周计划)</div>
                 <table class="settings-table">
                    <thead>
                        <tr>
                            <th style="width: 15%;">日期</th>
                            <th style="width: 30%;">排数</th>
                            <th style="width: 55%;">工作时间</th>
                        </tr>
                    </thead>
                    <tbody id="city-batch-week-body"></tbody>
                 </table>
            </div>
        `;

        const weekBody = container.querySelector('#city-batch-week-body');
        const weekMap = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 0: '周日' };
        
        [1, 2, 3, 4, 5, 6, 0].forEach(day => {
            // Default values from current store plan as a baseline
            const plan = planSettings[day]; 
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${weekMap[day]}</td>
                <td>
                    <div class="input-suffix-group">
                        <input type="number" class="edit-input" value="${plan.rows}" style="width: 60px;">
                        <span>排</span>
                    </div>
                </td>
                <td>
                    <input type="text" class="edit-input" value="${plan.time}" style="width: 120px;">
                </td>
            `;
            weekBody.appendChild(tr);
        });
    }

    // --- Import Suggestion Modal Logic ---
    const btnImportSuggestion = document.getElementById('btn-batch-update-plan'); // Reused ID, new text
    const importModal = document.getElementById('import-suggestion-modal');
    const closeImportBtns = document.querySelectorAll('.close-import-suggestion');
    const btnDownloadTemplate = document.getElementById('btn-download-template');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input-suggestion');
    const fileNameDisplay = document.getElementById('file-name-display');
    const btnSubmitImport = document.getElementById('btn-submit-import');

    if (btnImportSuggestion && importModal) {
        btnImportSuggestion.onclick = () => {
            importModal.style.display = 'flex';
            // Reset state
            fileInput.value = '';
            fileNameDisplay.style.display = 'none';
            fileNameDisplay.innerText = '';
            uploadArea.style.borderColor = '#d9d9d9';
        };
    }

    closeImportBtns.forEach(btn => {
        btn.onclick = () => importModal.style.display = 'none';
    });

    if (btnDownloadTemplate) {
        btnDownloadTemplate.onclick = () => {
            // Generate a simple CSV for demo
            const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
                + "门店ID(必填),门店名称,日期(必填),开点排数(必填),开始时间(必填),结束时间(必填),泳道类型(必填)\n"
                + "1001,国贸旗舰店,2026-02-21,5,10:00,18:00,全能\n"
                + "1002,三里屯概念店,2026-02-21,4,10:00,18:00,证件";
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "开点建议导入模版.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
    }

    if (uploadArea && fileInput) {
        uploadArea.onclick = () => fileInput.click();
        
        uploadArea.ondragover = (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#1890ff';
            uploadArea.style.backgroundColor = '#f0faff';
        };

        uploadArea.ondragleave = (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#d9d9d9';
            uploadArea.style.backgroundColor = 'transparent';
        };

        uploadArea.ondrop = (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#d9d9d9';
            uploadArea.style.backgroundColor = 'transparent';
            
            if (e.dataTransfer.files.length > 0) {
                handleFileSelect(e.dataTransfer.files[0]);
            }
        };

        fileInput.onchange = (e) => {
            if (fileInput.files.length > 0) {
                handleFileSelect(fileInput.files[0]);
            }
        };
    }

    function handleFileSelect(file) {
        fileNameDisplay.innerText = `已选择文件: ${file.name}`;
        fileNameDisplay.style.display = 'block';
    }

    if (btnSubmitImport) {
        btnSubmitImport.onclick = () => {
            if (fileNameDisplay.style.display === 'none') {
                alert('请先上传文件！');
                return;
            }
            
            // Simulate processing
            setTimeout(() => {
                alert('导入成功！\n已更新开点建议数据。');
                importModal.style.display = 'none';
                renderCityPlanTable(); // Refresh table (mock refresh)
            }, 500);
        };
    }

    // --- Operation Log Modal Logic Removed ---

    // --- Store Edit Modal Logic (Merged from Plan Settings) ---
    const storeEditModal = document.getElementById('store-edit-modal');
    const closeStoreEditBtns = document.querySelectorAll('.close-store-edit');
    const storeEditBody = document.getElementById('store-edit-modal-body');
    const btnSaveStoreEdit = document.getElementById('btn-save-store-edit');
    let currentEditStoreId = null;

    closeStoreEditBtns.forEach(btn => {
        btn.onclick = () => storeEditModal.style.display = 'none';
    });

    // Make functions global so they can be called from HTML onclick
    window.openStoreEditModal = function(storeId) {
        currentEditStoreId = storeId;
        const store = cityStores.find(s => s.id === storeId);
        if (!store) return;
        
        document.getElementById('store-edit-name').innerText = store.name;
        renderStoreEditContent(store);
        storeEditModal.style.display = 'flex';
    };

    function renderStoreEditContent(store) {
        if (!storeEditBody) return;
        storeEditBody.innerHTML = '';
        
        const listContainer = document.createElement('div');
        listContainer.style.maxWidth = '100%';
        listContainer.style.margin = '0 auto';
        storeEditBody.appendChild(listContainer);

        // --- 1. Opening Method Section (Hidden) ---
        // const openingSection = document.createElement('div');
        // openingSection.className = 'settings-card';
        // ... (Hidden)
        // listContainer.appendChild(openingSection);

        // --- 2. Weekly Template Section (Renumbered to 1) ---
        const templateSection = document.createElement('div');
        templateSection.className = 'settings-card';
        
        // Check if store has enabled flag, default to true if undefined
        if (typeof store.farTermEnabled === 'undefined') {
            store.farTermEnabled = true;
        }
        if (typeof store.storeVolume === 'undefined') {
            store.storeVolume = ''; // Default empty if not set
        }

        templateSection.innerHTML = `
            <div class="settings-section-title" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    1. 远期基本点位 <span style="color: red;">*</span>
                </div>
                <div class="switch-container">
                    <span style="font-size: 14px; color: #333; margin-right: 8px;">自动开点</span>
                    <label class="switch">
                        <input type="checkbox" id="far-term-toggle" ${store.farTermEnabled ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>

            <!-- Store Volume Selection -->
            <div id="store-volume-section" class="form-group" style="margin-bottom: 20px; transition: opacity 0.3s; ${store.farTermEnabled ? '' : 'opacity: 0.5; pointer-events: none;'}">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <label style="margin-bottom: 0;">
                        门店体量 <span style="color: red;">*</span>
                    </label>
                    <div style="width: 200px;">
                        <input type="text" id="store-volume-input" class="edit-input" value="${store.storeVolume || ''}" placeholder="请输入门店体量" style="width: 100%;">
                    </div>
                    <span class="form-hint"></span>
                </div>
            </div>

            <table class="settings-table" id="far-term-table" style="${store.farTermEnabled ? '' : 'opacity: 0.5; pointer-events: none;'}">
                <thead>
                    <tr>
                        <th style="width: 15%;">日期</th>
                        <th style="width: 30%;">排数</th>
                        <th style="width: 55%;">可约时间</th>
                    </tr>
                </thead>
                <tbody id="store-template-body"></tbody>
            </table>
        `;
        listContainer.appendChild(templateSection);

        const toggle = templateSection.querySelector('#far-term-toggle');
        const table = templateSection.querySelector('#far-term-table');
        const volumeSection = templateSection.querySelector('#store-volume-section');
        
        toggle.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            store.farTermEnabled = isChecked;
            
            if (isChecked) {
                table.style.opacity = '1';
                table.style.pointerEvents = 'auto';
                volumeSection.style.opacity = '1';
                volumeSection.style.pointerEvents = 'auto';
            } else {
                table.style.opacity = '0.5';
                table.style.pointerEvents = 'none';
                volumeSection.style.opacity = '0.5';
                volumeSection.style.pointerEvents = 'none';
                showToast('不会自动调整3个月内已开启点位');
            }
        });

        // Store Volume Logic
        const volumeInput = templateSection.querySelector('#store-volume-input');
        if (volumeInput) {
            volumeInput.addEventListener('input', (e) => {
                store.storeVolume = e.target.value;
            });
        }

        const templateBody = templateSection.querySelector('#store-template-body');
        const weekMap = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 0: '周日' };
        
        // Generate time options for select (08:00 to 23:30)
        let timeOptions = '';
        for (let h = 8; h <= 23; h++) {
            ['00', '30'].forEach(m => {
                const t = `${String(h).padStart(2, '0')}:${m}`;
                timeOptions += `<option value="${t}">${t}</option>`;
            });
        }

        [1, 2, 3, 4, 5, 6, 0].forEach(day => {
            const p = store.plan[day];
            const rows = (typeof p === 'object') ? p.rows : p;
            const time = (typeof p === 'object') ? p.time : '10:00~18:00'; // Default if missing
            const [startTime, endTime] = time.split('~');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${weekMap[day]}</td>
                <td>
                    <div class="input-suffix-group">
                        <input type="number" class="edit-input template-rows" data-day="${day}" value="${rows}" style="width: 80px;">
                        <span>排</span>
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <select class="edit-input template-start-time" data-day="${day}" style="width: 100px;">
                            ${timeOptions.replace(`value="${startTime}"`, `value="${startTime}" selected`)}
                        </select>
                        <span style="color: #999;">~</span>
                        <select class="edit-input template-end-time" data-day="${day}" style="width: 100px;">
                            ${timeOptions.replace(`value="${endTime}"`, `value="${endTime}" selected`)}
                        </select>
                    </div>
                </td>
            `;
            templateBody.appendChild(tr);
        });

        // --- 3. Recent Target Spots Section (Refactored) ---
        const recoverySection = document.createElement('div');
        recoverySection.className = 'settings-card';
        
        // Initialize mock data if not present
        if (!store.recoveryDays) store.recoveryDays = [6, 0]; // Default Sat, Sun
        if (typeof store.autoOpenEnabled === 'undefined') store.autoOpenEnabled = false; // Default OFF
        if (typeof store.adjustmentDays === 'undefined') store.adjustmentDays = 7;
        if (typeof store.activityCycles === 'undefined') store.activityCycles = []; // Array for multi-select
        
        // Week Checkboxes Logic
        // weekMap already defined in scope
        let checkboxesHtml = '';
        [1, 2, 3, 4, 5, 6, 0].forEach(day => {
            const isChecked = store.recoveryDays.includes(day) ? 'checked' : '';
            checkboxesHtml += `
                <label style="margin-right: 15px; display: inline-flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" class="recovery-day-checkbox" value="${day}" ${isChecked} style="margin-right: 4px;">
                    ${weekMap[day]}
                </label>
            `;
        });

        // Activity Cycle Checkboxes Logic
        const activityOptions = [
            { value: 'spring_festival', label: '春节不打烊' },
            { value: 'national_day', label: '国庆黄金周' },
            { value: 'double_11', label: '双11大促' },
            { value: 'christmas', label: '圣诞狂欢' }
        ];
        
        // Generate a text list of applied activities instead of checkboxes
        const appliedActivityLabels = store.activityCycles
            .map(val => {
                const opt = activityOptions.find(o => o.value === val);
                return opt ? opt.label : val;
            })
            .filter(Boolean);
            
        let activityDisplayText = appliedActivityLabels.length > 0 
            ? appliedActivityLabels.join('、') 
            : '暂无应用活动';

        recoverySection.innerHTML = `
            <div class="settings-section-title">2. 近期目标点位</div>
            
            <!-- 2.1 Target Spots -->
            <div class="form-group" style="margin-bottom: 25px;">
                <label style="font-weight: 500; margin-bottom: 8px; display: block;">第1步：目标点位</label>
                <div style="font-size: 13px; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">
                    <i style="margin-right: 5px;">💡</i> 请在列表页统一导入
                </div>
            </div>

            <!-- 2.2 Auto Open -->
            <div class="form-group" style="margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <label style="font-weight: 500; margin-bottom: 0;">第2步：自动开点</label>
                </div>
                
                <div id="auto-open-content" style="padding-left: 10px;">
                    <div style="font-size: 12px; color: #1890ff; margin-bottom: 15px; background: #e6f7ff; padding: 8px; border-radius: 4px; border: 1px solid #91d5ff;">
                        应用日将根据目标自动开点，并同步回收门店关点权限；若修改日期历史开点不做调整
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="font-size: 13px; color: #666; display: block; margin-bottom: 6px;">应用日期：</label>
                        <div>${checkboxesHtml}</div>
                    </div>

                    <div style="margin-bottom: 5px;">
                        <label style="font-size: 13px; color: #666; display: block; margin-bottom: 6px;">应用活动：</label>
                        <div style="font-size: 13px; color: #333; padding: 8px; background: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 4px; display: inline-block; min-width: 200px;">
                            ${activityDisplayText}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2.3 Store Adjustment -->
            <div class="form-group" id="store-adjustment-section">
                <label style="font-weight: 500; margin-bottom: 8px; display: block;">第3步：门店可调节点</label>
                <div style="padding-left: 10px;">
                    <div style="font-size: 14px; color: #333; margin-bottom: 8px;">
                        拍前
                        <input type="number" id="adjustment-days-input" class="edit-input" value="${store.adjustmentDays !== null ? store.adjustmentDays : 7}" min="0" style="width: 60px; text-align: center;">
                        天
                        <span style="font-size: 12px; color: #999; margin-left: 10px;">(0为拍摄当日，空则不支持门店调节)</span>
                    </div>
                </div>
            </div>
        `;
        listContainer.appendChild(recoverySection);

        // Store Adjustment Input Logic
        const adjustmentInput = recoverySection.querySelector('#adjustment-days-input');
        if (adjustmentInput) {
            adjustmentInput.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val === '') {
                    store.adjustmentDays = null;
                } else {
                    const intVal = parseInt(val);
                    if (intVal >= 0) {
                        store.adjustmentDays = intVal;
                    } else {
                        // Invalid input, reset to default 7 or previous valid?
                        // Let's reset to 7 as safe default if user enters negative
                        e.target.value = 7; 
                        store.adjustmentDays = 7;
                    }
                }
            });
        }

        // --- 4. Modify Monthly Plan (Hidden) ---
        // const monthlySection = document.createElement('div');
        // ... (Hidden)
    }

    if (btnSaveStoreEdit) {
        btnSaveStoreEdit.onclick = () => {
            const store = cityStores.find(s => s.id === currentEditStoreId);
            if (!store) return;

            // 1. Save Opening Method (Hidden, skip update or keep existing)
            // ...

            // Save Store Volume
            if (store.farTermEnabled && !store.storeVolume) {
                alert('请选择门店体量！');
                return;
            }

            // 2. Save Weekly Template
            const templateRows = document.querySelectorAll('.template-rows');
            const templateStartTimes = document.querySelectorAll('.template-start-time');
            const templateEndTimes = document.querySelectorAll('.template-end-time');
            
            templateRows.forEach(input => {
                const day = input.dataset.day;
                const rows = parseInt(input.value) || 0;
                // Ensure object structure
                if (typeof store.plan[day] !== 'object') {
                    store.plan[day] = { rows: 0, time: '' };
                }
                store.plan[day].rows = rows;
            });
            
            templateStartTimes.forEach(startSelect => {
                const day = startSelect.dataset.day;
                const endSelect = Array.from(templateEndTimes).find(s => s.dataset.day === day);
                if (endSelect) {
                    const time = `${startSelect.value}~${endSelect.value}`;
                    if (typeof store.plan[day] !== 'object') {
                        store.plan[day] = { rows: 0, time: '' };
                    }
                    store.plan[day].time = time;
                }
            });

            // 3. Save Recovery Settings (New)
            const recoveryCheckboxes = document.querySelectorAll('.recovery-day-checkbox');
            const selectedDays = [];
            recoveryCheckboxes.forEach(cb => {
                if (cb.checked) selectedDays.push(parseInt(cb.value));
            });
            store.recoveryDays = selectedDays;
            
            // Save Activity Cycles - Removed as they are read-only from global activity management
            // const activityCheckboxes = document.querySelectorAll('.activity-cycle-checkbox');
            // const selectedActivities = [];
            // activityCheckboxes.forEach(cb => {
            //    if (cb.checked) selectedActivities.push(cb.value);
            // });
            // store.activityCycles = selectedActivities;
            const selectedActivities = store.activityCycles; // Keep existing
            
            // Save Adjustment Days
            const adjustmentInput = document.getElementById('adjustment-days-input');
            const adjVal = adjustmentInput.value;
            store.adjustmentDays = (adjVal === '') ? null : (parseInt(adjVal) || 0);

            // 4. Apply Monthly Batch (Hidden/Removed)
            
            // Note: store.autoOpenEnabled is now implicitly true or managed elsewhere, not toggled here
            alert(`配置已保存！\n\n1. 门店 "${store.name}" 的周模板已更新。\n2. 选定周期: ${selectedDays.length} 天\n3. 活动: ${selectedActivities.length} 个\n4. 拍前 ${store.adjustmentDays !== null ? store.adjustmentDays : '不限'} 天可调。`);
            
            storeEditModal.style.display = 'none';
            renderCityPlanTable(); // Refresh table
        };
    }

    // Remove old functions
    window.renderPlanSettingsPage = null;
    window.saveAllSettings = null;

    // Current Active Store Logic
    function initializeActiveStore() {
        // Find active store from sidebar or default
        const activeItem = document.querySelector('.store-item.active');
        const storeName = activeItem ? activeItem.innerText.trim() : '杭州湖滨银泰in77店';
        
        currentActiveStore = cityStores.find(s => s.name === storeName) || cityStores[0];
        
        // Update plan settings based on store
        if (currentActiveStore && currentActiveStore.plan) {
            // Deep copy to avoid reference issues
            planSettings = JSON.parse(JSON.stringify(currentActiveStore.plan));
        }
    }

    // Sidebar Click Logic
    const storeItems = document.querySelectorAll('.store-item');
    storeItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all
            storeItems.forEach(i => i.classList.remove('active'));
            // Add active to clicked
            item.classList.add('active');
            
            // Re-initialize and render
            initializeActiveStore();
            // Check if we are on operation page
            if (document.getElementById('operation-calendar-view')) {
                renderWeekdayHeaders();
                renderOperationCalendar(currentOpYear, currentOpMonth);
                updateOpCalendarMonthDisplay();
            }
        });
    });

    // Initialize Active Store on Load
    initializeActiveStore();

    // --- Activity Management Drawer Logic ---
    const btnActivityManage = document.getElementById('btn-activity-manage');
    const activityDrawer = document.getElementById('activity-drawer');
    const closeActivityDrawerBtn = document.querySelector('.close-activity-drawer');
    const activityListContainer = document.getElementById('activity-list-container');

    const activities = [
        {
            name: '春节不打烊',
            period: '2026-02-01 ~ 2026-02-16',
            storeCount: 270,
            status: 'active'
        },
        {
            name: '国庆黄金周',
            period: '2025-10-01 ~ 2025-10-07',
            storeCount: 350,
            status: 'ended'
        }
    ];

    function renderActivityList() {
        if (!activityListContainer) return;
        activityListContainer.innerHTML = '';

        activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.style.cssText = 'background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #e8e8e8;';
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div style="font-weight: 500; font-size: 15px; color: #333;">${activity.name}</div>
                    ${activity.status === 'active' 
                        ? '<span class="tag tag-success" style="background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; padding: 1px 6px; font-size: 11px; border-radius: 4px;">进行中</span>' 
                        : '<span class="tag tag-default" style="background: #f5f5f5; color: #999; border: 1px solid #d9d9d9; padding: 1px 6px; font-size: 11px; border-radius: 4px;">已结束</span>'}
                </div>
                
                <div style="font-size: 13px; color: #666; margin-bottom: 6px;">
                    <i style="margin-right: 5px; width: 14px; display: inline-block; text-align: center;">📅</i>${activity.period}
                </div>
                
                <div style="font-size: 13px; color: #666; margin-bottom: 15px;">
                    <i style="margin-right: 5px; width: 14px; display: inline-block; text-align: center;">🏠</i>门店：${activity.storeCount} 家
                </div>
                
                <div style="display: flex; gap: 10px; border-top: 1px solid #f0f0f0; padding-top: 12px;">
                    <button class="btn-primary btn-sm btn-update-activity" style="flex: 1; padding: 6px 0;">更新门店</button>
                    <button class="btn-secondary btn-sm btn-export-activity" style="flex: 1; padding: 6px 0;">导出</button>
                </div>
            `;
            
            // Add event listeners for buttons
            const btnUpdate = item.querySelector('.btn-update-activity');
            const btnExport = item.querySelector('.btn-export-activity');
            
            btnUpdate.onclick = () => {
                if (activity.status !== 'active') {
                    showToast('操作失败，活动已结束');
                    return;
                }
                
                // Trigger file input click simulation
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.xlsx, .xls';
                fileInput.onchange = (e) => {
                    if (e.target.files.length > 0) {
                        alert(`已成功更新活动 "${activity.name}" 的门店名单！\n文件: ${e.target.files[0].name}`);
                    }
                };
                fileInput.click();
            };
            
            btnExport.onclick = () => {
                alert(`正在导出活动 "${activity.name}" 的门店明细...`);
            };

            activityListContainer.appendChild(item);
        });
    }

    if (btnActivityManage && activityDrawer) {
        btnActivityManage.onclick = () => {
            activityDrawer.style.display = 'flex'; // Use flex to center/align
            renderActivityList();
        };
        
        if (closeActivityDrawerBtn) {
            closeActivityDrawerBtn.onclick = () => {
                activityDrawer.style.display = 'none';
            };
        }
        
        // Click outside to close
        activityDrawer.addEventListener('click', (e) => {
            if (e.target === activityDrawer) {
                activityDrawer.style.display = 'none';
            }
        });
    }

    // Initialize App
    setupTabSwitching();
    if (document.getElementById('city-plan-view')) {
        renderCityPlanTable();
    }
});
