// --- Counter Module ---

function updateCounter() {
    const marriageDate = dayjs('2023-08-14T15:00:00+10:00');
    const now = dayjs();
    const duration = dayjs.duration(now.diff(marriageDate))

    document.getElementById('years').innerText = duration.years();
    document.getElementById('months').innerText = duration.months();
    document.getElementById('days').innerText = duration.days();
    document.getElementById('hours').innerText = duration.hours();
    document.getElementById('minutes').innerText = duration.minutes();
    document.getElementById('seconds').innerText = duration.seconds();
}

// --- Timeline Module ---

async function createTimeline() {
    const timeline = document.getElementById('timeline');

    // Fetch data from Flask endpoint
    const response = await fetch('/getTimelineData');
    const timelineData = await response.json();

    timelineData.forEach(item => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';

        timelineItem.innerHTML = `
                    <div class="timeline-content">
                        <div class="timeline-date">${item.date}</div>
                        <div class="timeline-location">${item.location}</div>
                        <div class="timeline-event">${item.event}</div>
                    </div>
                `;

        timeline.appendChild(timelineItem);
    });
}

// --- Parent Bank Module ---

function updateProgressBar() {
    const monthlySavings = 2000;
    const totalTarget = 240000;

    const startTime = dayjs('2025-01-01T00:00:00+10:00');
    const endTime = dayjs('2034-12-31T23:59:59+10:00');
    // const now = dayjs('2034-12-31T23:59:59+10:00');
    const now = dayjs();

    let monthsPassed;
    if (now.isBefore(startTime)) {
        monthsPassed = 0;
    } else if (now.isAfter(endTime)) {
        monthsPassed = endTime.diff(startTime, 'months') + 1;
    } else {
        monthsPassed = now.diff(startTime, 'months');
    }

    const targetSaved = monthsPassed * monthlySavings;
    const currentProgressAmount = Math.min(targetSaved, totalTarget); // Cap at total target
    const percentage = (currentProgressAmount / totalTarget) * 100;

    document.getElementById('parent-bank-current-amount').innerText = `AUD $${currentProgressAmount.toLocaleString()}`;
    document.getElementById('parent-bank-progress-bar').style.width = percentage + '%';
    document.getElementById('parent-bank-progress-text').innerText = percentage.toFixed(2) + '%';
}

// --- Workday Module ---

// 1. Load Data from JSON (updated to fetch from server)
async function loadWorkdayData() {
    try {
        const response = await fetch('/getWorkdayData');
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error('Failed to load workday data:', response.statusText);
            return {};
        }
    } catch (error) {
        console.error('Error loading workday data:', error);
        return {};
    }
}

// 2. Save Data to JSON (updated to send data to server)
async function saveWorkdayData(workdayData) {
    try {
        const response = await fetch('/saveWorkdayData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workdayData) // Convert data to JSON string
        });
        if (!response.ok) {
            throw new Error('Failed to save workday data.');
        }
        // console.log('Workday data saved successfully.');
    } catch (error) {
        console.error('Error saving workday data:', error);
    }
}

// 3. Calculate Weekly Hours
function calculateWeeklyHours(workdayData, selectedDate) {

    let weekStartDate;
    if (dayjs(selectedDate).day() >= 3) {
        weekStartDate = dayjs(selectedDate).startOf('week').add(3, 'day');
    } else {
        weekStartDate = dayjs(selectedDate).startOf('week').subtract(4, 'day');
    }

    let calculateDate = weekStartDate;
    let totalSeconds = 0;

    for (let i = 0; i < 7; i++, calculateDate = calculateDate.add(1, 'day')) {
        const dateStr = calculateDate.format('YYYY-MM-DD');
        if (workdayData[dateStr]) {
            const entry = workdayData[dateStr];
            const start = dayjs(dateStr + 'T' + entry.startTime);
            const lunchStart = dayjs(dateStr + 'T' + entry.lunchStart);
            const lunchEnd = dayjs(dateStr + 'T' + entry.lunchEnd);
            const end = dayjs(dateStr + 'T' + entry.endTime);

            // Check if the input timesheet is valid
            if (!start.isValid() || !lunchStart.isValid() || !lunchEnd.isValid() || !end.isValid()) {
                continue;
            }
            if (dayjs.duration(lunchStart.diff(start)) < 0) {
                continue;
            }
            if (dayjs.duration(lunchEnd.diff(lunchStart)) < 0) {
                continue;
            }
            if (dayjs.duration(end.diff(lunchEnd)) < 0) {
                continue;
            }

            // If everything is ok, accumulate the working hours
            const workDuration = dayjs.duration(end.diff(start));
            const lunchDuration = dayjs.duration(lunchEnd.diff(lunchStart));
            totalSeconds += workDuration.subtract(lunchDuration).as('seconds');
        }
    }

    const totalHours = totalSeconds / 3600; // Get total hours as a decimal
    const formattedHours = totalHours.toFixed(2); // Format with 2 decimal places

    const wholeHours = Math.floor(totalHours); // Get the whole number part
    const minutes = Math.round((totalHours - wholeHours) * 60); // Get the remaining minutes
    return `${formattedHours} Hours (${wholeHours} Hour ${minutes} Min)`;
}

// 4. Update Input Fields
function updateInputFields(workdayData, selectedDate) {
    const entry = workdayData[selectedDate];
    document.getElementById('workday-start-time').value = entry ? entry.startTime : '08:00';
    document.getElementById('workday-lunch-start').value = entry ? entry.lunchStart : '13:00';
    document.getElementById('workday-lunch-end').value = entry ? entry.lunchEnd : '14:00';

    const endTime = '17:00'
    document.getElementById('workday-end-time').value = entry ? entry.endTime : endTime;

    // Update weekly hours display whenever a date is selected
    updateWeeklyHoursDisplay(workdayData, selectedDate);
}

// 5. Update Weekly Hours Display
function updateWeeklyHoursDisplay(workdayData, selectedDate) {
    const weeklyHours = calculateWeeklyHours(workdayData, selectedDate);
    document.getElementById('workday-weekly-hours').textContent = weeklyHours;
}

// 6. Event Listeners and Initialization
async function initializeWorkdayModule() {
    let workdayData = await loadWorkdayData(); // Load data first
    let selectedDate = dayjs().format('YYYY-MM-DD'); // Initially selected date (today)

    // Initialize Flatpickr
    const workdayCalendar = flatpickr("#workday-calendar", {
        dateFormat: "Y-m-d",
        defaultDate: selectedDate, // Use loaded selectedDate
        inline: true,
        locale: {
            firstDayOfWeek: 1
        },
        onChange: function (selectedDates, dateStr, instance) {
            selectedDate = dateStr;
            updateInputFields(workdayData, selectedDate);
            updateWeeklyHoursDisplay(workdayData, selectedDate);
        },
        onDayCreate: function (dObj, dStr, fp, dayElem) {
            // Highlight days with work entries
            const dateStr = dayjs(dayElem.dateObj).format('YYYY-MM-DD');
            if (workdayData[dateStr]) {
                dayElem.classList.add('worked-day');
            }
        }
    });

    // Update input fields and weekly hours on page load
    updateInputFields(workdayData, selectedDate);
    updateWeeklyHoursDisplay(workdayData, selectedDate);

    // Event listener for save button
    document.getElementById('workday-save-button').addEventListener('click', () => {
        workdayData[selectedDate] = {
            startTime: document.getElementById('workday-start-time').value,
            lunchStart: document.getElementById('workday-lunch-start').value,
            lunchEnd: document.getElementById('workday-lunch-end').value,
            endTime: document.getElementById('workday-end-time').value
        };
        saveWorkdayData(workdayData);
        updateWeeklyHoursDisplay(workdayData, selectedDate);
        workdayCalendar.redraw(); // Update the calendar to highlight the saved date
    });

    // Event listener for reset button
    document.getElementById('workday-reset-button').addEventListener('click', () => {
        if (workdayData[selectedDate]) {
            delete workdayData[selectedDate]; // Delete data for selected date
            saveWorkdayData(workdayData); // Save the updated data

            // Reset input fields to default values
            updateInputFields(workdayData, selectedDate);

            // Redraw the calendar
            workdayCalendar.redraw();
        }
    });
}
