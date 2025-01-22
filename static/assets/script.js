// --- Counter Module ---

function updateCounter() {
    const marriageDate = moment.parseZone('2023-08-14T15:00:00+10:00');
    const now = moment();
    const duration = moment.duration(now.diff(marriageDate));

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

    const startMoment = moment.parseZone('2025-01-01T00:00:00+10:00');
    const endMoment = moment.parseZone('2034-12-31T23:59:59+10:00');
    // const now = moment.parseZone('2034-12-31T23:59:59+10:00');
    const now = moment();

    let monthsPassed;
    if (now.isBefore(startMoment)) {
        monthsPassed = 0;
    } else if (now.isAfter(endMoment)) {
        monthsPassed = endMoment.diff(startMoment, 'months') + 1;
    } else {
        monthsPassed = now.diff(startMoment, 'months');
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
    const calculateDate = moment(selectedDate).startOf('isoWeek');
    let totalSeconds = 0;

    for (let i = 0; i < 7; i++, calculateDate.add(1, 'day')) {
        const date = calculateDate.format('YYYY-MM-DD');
        if (workdayData[date]) {
            const entry = workdayData[date];
            const start = moment(date + 'T' + entry.startTime);
            const lunchStart = moment(date + 'T' + entry.lunchStart);
            const lunchEnd = moment(date + 'T' + entry.lunchEnd);
            const end = moment(date + 'T' + entry.endTime);

            // Check if the input timesheet is valid
            if (!start.isValid() || !lunchStart.isValid() || !lunchEnd.isValid() || !end.isValid()) {
                continue;
            }
            if (moment.duration(lunchStart.diff(start)) < 0) {
                continue;
            }
            if (moment.duration(lunchEnd.diff(lunchStart)) < 0) {
                continue;
            }
            if (moment.duration(end.diff(lunchEnd)) < 0) {
                continue;
            }

            // If everything is ok, accumulate the working hours
            const workDuration = moment.duration(end.diff(start));
            const lunchDuration = moment.duration(lunchEnd.diff(lunchStart));
            totalSeconds += workDuration.subtract(lunchDuration).asSeconds();
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

    // Convert selectedDate string to moment object for getDay()
    const selectedMoment = moment(selectedDate);
    const endTime = selectedMoment.day() === 5 ? '17:00' : '18:00'; // 5 represents Friday
    document.getElementById('workday-end-time').value = entry ? entry.endTime : endTime; // 5 represents Friday

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
    let selectedDate = moment().format('YYYY-MM-DD'); // Initially selected date (today)

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
            const dateStr = moment(dayElem.dateObj).format('YYYY-MM-DD');
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
