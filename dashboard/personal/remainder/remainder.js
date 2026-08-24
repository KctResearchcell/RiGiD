/* =========================================================
   RiGiD — REMAINDER
   Reminder Management
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       HELPERS
    ===================================================== */

    const $ = (selector) =>
        document.querySelector(selector);

    const $$ = (selector) =>
        document.querySelectorAll(selector);


    function todayISO() {

        const date = new Date();

        const offset =
            date.getTimezoneOffset() * 60000;

        return new Date(
            date.getTime() - offset
        ).toISOString().slice(0, 10);

    }


    function formatDate(dateString) {

        if (!dateString)
            return "";

        const date =
            new Date(`${dateString}T00:00:00`);

        if (Number.isNaN(date.getTime()))
            return dateString;

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        ).toUpperCase();

    }


    function formatShortDate(dateString) {

        if (!dateString)
            return "";

        const date =
            new Date(`${dateString}T00:00:00`);

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short"
            }
        ).toUpperCase();

    }


    function showToast(message) {

        const toast =
            $("#remainderToast");

        if (!toast)
            return;

        toast.textContent =
            message;

        toast.classList.remove(
            "hidden"
        );

        clearTimeout(
            window.remainderToastTimer
        );

        window.remainderToastTimer =
            setTimeout(
                () => {
                    toast.classList.add(
                        "hidden"
                    );
                },
                2200
            );

    }


    function openModal(modal) {

        if (!modal)
            return;

        modal.classList.remove(
            "hidden"
        );

        document.body.style.overflow =
            "hidden";

    }


    function closeModal(modal) {

        if (!modal)
            return;

        modal.classList.add(
            "hidden"
        );

        document.body.style.overflow =
            "";

    }


    /* =====================================================
       LIVE DATE + CLOCK
    ===================================================== */

    function updateClock() {

        const now =
            new Date();


        const dateElement =
            $("#remainderDate");

        const clockElement =
            $("#remainderClock");

        const sectionDate =
            $("#todaySectionDate");


        if (dateElement) {

            dateElement.textContent =
                now.toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                ).toUpperCase();

        }


        if (clockElement) {

            clockElement.textContent =
                now.toLocaleTimeString(
                    "en-US",
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }
                );

        }


        if (sectionDate) {

            sectionDate.textContent =
                now.toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short"
                    }
                ).toUpperCase();

        }

    }


    updateClock();

    setInterval(
        updateClock,
        1000
    );


    /* =====================================================
       MODALS
    ===================================================== */

    const reminderModal =
        $("#reminderModal");

    const quickReminderModal =
        $("#quickReminderModal");


    /* =====================================================
       DEFAULT DATE / TIME
    ===================================================== */

    function setDefaultReminderValues() {

        const date =
            $("#reminderDate");

        const time =
            $("#reminderTime");

        const repeat =
            $("#reminderRepeat");

        const priority =
            $("#reminderPriority");

        const notification =
            $("#notificationBefore");


        if (date)
            date.value =
                todayISO();


        if (time) {

            const now =
                new Date();

            now.setMinutes(
                now.getMinutes() + 30
            );


            const hours =
                String(
                    now.getHours()
                ).padStart(2, "0");


            const minutes =
                String(
                    now.getMinutes()
                ).padStart(2, "0");


            time.value =
                `${hours}:${minutes}`;

        }


        if (repeat)
            repeat.value =
                "once";


        if (priority)
            priority.value =
                "medium";


        if (notification)
            notification.value =
                "15";

    }


    function clearReminderForm() {

        if ($("#reminderTitle"))
            $("#reminderTitle").value =
                "";

        if ($("#reminderDescription"))
            $("#reminderDescription").value =
                "";

        if ($("#relatedItem"))
            $("#relatedItem").selectedIndex =
                0;

        setDefaultReminderValues();

    }


    /* =====================================================
       OPEN NEW REMINDER
    ===================================================== */

    $("#openReminderModal")
        ?.addEventListener(
            "click",
            () => {

                clearReminderForm();

                openModal(
                    reminderModal
                );

            }
        );


    $("#closeReminderModal")
        ?.addEventListener(
            "click",
            () => {

                closeModal(
                    reminderModal
                );

            }
        );


    $("#cancelReminder")
        ?.addEventListener(
            "click",
            () => {

                closeModal(
                    reminderModal
                );

            }
        );


    /* =====================================================
       QUICK REMINDER
    ===================================================== */

    function openQuickReminder() {

        const title =
            $("#quickReminderTitle");

        const date =
            $("#quickReminderDate");

        const time =
            $("#quickReminderTime");


        if (title)
            title.value =
                "";


        if (date)
            date.value =
                todayISO();


        if (time)
            time.value =
                "18:00";


        openModal(
            quickReminderModal
        );

    }


    $("#quickReminderButton")
        ?.addEventListener(
            "click",
            openQuickReminder
        );


    $("#closeQuickReminderModal")
        ?.addEventListener(
            "click",
            () => {

                closeModal(
                    quickReminderModal
                );

            }
        );


    $("#cancelQuickReminder")
        ?.addEventListener(
            "click",
            () => {

                closeModal(
                    quickReminderModal
                );

            }
        );


    /* =====================================================
       CATEGORY
    ===================================================== */

    const categorySelect =
        $("#reminderCategory");

    const relatedItemSelect =
        $("#relatedItem");


    const relatedItems = {

        study: [
            "MPPT Algorithms",
            "Control Systems",
            "Power Electronics",
            "Instrumentation"
        ],

        paper: [
            "Natural Fibre Air Filters",
            "Outdoor Air Filtration Review",
            "Current Research Paper"
        ],

        simulation: [
            "PMSG Simulation",
            "FOC Simulation",
            "MPPT Simulation",
            "Wind Turbine Model"
        ],

        project: [
            "Team SULAL",
            "BEMS Project",
            "Load Balancer",
            "SLAPS"
        ],

        prototype: [
            "Wind Turbine Prototype",
            "Dual Rotor Prototype",
            "Power Electronics Prototype"
        ],

        task: [
            "General Task",
            "Documentation",
            "Team Task"
        ],

        meeting: [
            "Team Meeting",
            "Project Review",
            "Mentor Meeting"
        ],

        general: [
            "General"
        ]

    };


    function updateRelatedItems() {

        if (!categorySelect ||
            !relatedItemSelect)
            return;


        const category =
            categorySelect.value;


        const items =
            relatedItems[category] ||
            [];


        relatedItemSelect.innerHTML = "";


        const none =
            document.createElement(
                "option"
            );

        none.value =
            "";

        none.textContent =
            "None";


        relatedItemSelect.appendChild(
            none
        );


        items.forEach(
            item => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    item;

                option.textContent =
                    item;

                relatedItemSelect.appendChild(
                    option
                );

            }
        );

    }


    categorySelect
        ?.addEventListener(
            "change",
            updateRelatedItems
        );


    updateRelatedItems();


    /* =====================================================
       CREATE REMINDER CARD
    ===================================================== */

    function createReminderCard(data) {

        const article =
            document.createElement(
                "article"
            );


        article.className =
            "reminder-card";


        article.dataset.category =
            data.category;


        article.dataset.status =
            "upcoming";


        article.dataset.date =
            data.date;


        article.dataset.time =
            data.time;


        const timeParts =
            convertTime(data.time);


        article.innerHTML = `

            <div class="reminder-time">

                <strong>
                    ${timeParts.time}
                </strong>

                <span>
                    ${timeParts.period}
                </span>

            </div>


            <div
                class="reminder-category ${data.category}"
            >

                <span class="category-dot"></span>

                ${data.category.toUpperCase()}

            </div>


            <div class="reminder-content">

                <div class="reminder-title-row">

                    <h3></h3>

                    <span
                        class="priority ${data.priority}"
                    >
                        ${data.priority.toUpperCase()}
                    </span>

                </div>


                <p></p>


                <div class="reminder-meta">

                    <span class="related-item">
                    </span>

                    <span class="duration">
                    </span>

                </div>

            </div>


            <div class="reminder-actions">

                <button
                    class="complete-reminder"
                    type="button"
                    title="Mark complete"
                >
                    ✓
                </button>

                <button
                    class="edit-reminder"
                    type="button"
                >
                    Edit
                </button>

            </div>

        `;


        article.querySelector(
            "h3"
        ).textContent =
            data.title;


        article.querySelector(
            ".reminder-content > p"
        ).textContent =
            data.description ||
            "No description added.";


        article.querySelector(
            ".related-item"
        ).textContent =
            data.related
                ? `${capitalize(data.category)} → ${data.related}`
                : capitalize(data.category);


        article.querySelector(
            ".duration"
        ).textContent =
            data.duration ||
            "";


        attachReminderEvents(
            article
        );


        return article;

    }


    /* =====================================================
       TIME FORMAT
    ===================================================== */

    function convertTime(time) {

        if (!time) {

            return {
                time: "--:--",
                period: ""
            };

        }


        const parts =
            time.split(":");


        let hours =
            Number(parts[0]);


        const minutes =
            parts[1] || "00";


        const period =
            hours >= 12
                ? "PM"
                : "AM";


        hours =
            hours % 12 || 12;


        return {

            time:
                `${String(hours).padStart(2, "0")}:${minutes}`,

            period

        };

    }


    /* =====================================================
       CAPITALIZE
    ===================================================== */

    function capitalize(text) {

        if (!text)
            return "";

        return text
            .charAt(0)
            .toUpperCase() +
            text.slice(1);

    }


    /* =====================================================
       SAVE NEW REMINDER
    ===================================================== */

    $("#saveReminder")
        ?.addEventListener(
            "click",
            () => {

                const title =
                    $("#reminderTitle")
                        ?.value
                        .trim();


                const category =
                    $("#reminderCategory")
                        ?.value ||
                    "general";


                const related =
                    $("#relatedItem")
                        ?.value ||
                    "";


                const date =
                    $("#reminderDate")
                        ?.value;


                const time =
                    $("#reminderTime")
                        ?.value;


                const repeat =
                    $("#reminderRepeat")
                        ?.value ||
                    "once";


                const priority =
                    $("#reminderPriority")
                        ?.value ||
                    "medium";


                const description =
                    $("#reminderDescription")
                        ?.value
                        .trim();


                const notification =
                    $("#notificationBefore")
                        ?.value ||
                    "0";


                if (!title) {

                    showToast(
                        "Enter a reminder title"
                    );

                    $("#reminderTitle")
                        ?.focus();

                    return;

                }


                if (!date) {

                    showToast(
                        "Select a date"
                    );

                    return;

                }


                if (!time) {

                    showToast(
                        "Select a time"
                    );

                    return;

                }


                const data = {

                    title,

                    category,

                    related,

                    date,

                    time,

                    repeat,

                    priority,

                    description,

                    notification

                };


                const card =
                    createReminderCard(
                        data
                    );


                if (
                    date === todayISO()
                ) {

                    $("#todayReminderList")
                        ?.appendChild(card);

                } else {

                    addReminderToUpcoming(
                        data
                    );

                }


                closeModal(
                    reminderModal
                );


                updateCounts();

                applyCurrentFilter();


                showToast(
                    "Reminder created"
                );

            }
        );


    /* =====================================================
       QUICK SAVE
    ===================================================== */

    $("#saveQuickReminder")
        ?.addEventListener(
            "click",
            () => {

                const title =
                    $("#quickReminderTitle")
                        ?.value
                        .trim();


                const date =
                    $("#quickReminderDate")
                        ?.value ||
                    todayISO();


                const time =
                    $("#quickReminderTime")
                        ?.value ||
                    "18:00";


                if (!title) {

                    showToast(
                        "Enter a reminder"
                    );

                    return;

                }


                const data = {

                    title,

                    category: "general",

                    related: "",

                    date,

                    time,

                    priority: "medium",

                    description: "",

                    repeat: "once",

                    notification: "0"

                };


                const card =
                    createReminderCard(
                        data
                    );


                if (
                    date === todayISO()
                ) {

                    $("#todayReminderList")
                        ?.appendChild(card);

                } else {

                    addReminderToUpcoming(
                        data
                    );

                }


                closeModal(
                    quickReminderModal
                );


                updateCounts();

                applyCurrentFilter();


                showToast(
                    "Quick reminder added"
                );

            }
        );


    /* =====================================================
       UPCOMING TIMELINE
    ===================================================== */

    function addReminderToUpcoming(data) {

        const timeline =
            $("#upcomingTimeline");


        if (!timeline)
            return;


        const date =
            new Date(
                `${data.date}T00:00:00`
            );


        const day =
            String(
                date.getDate()
            ).padStart(2, "0");


        const month =
            date.toLocaleDateString(
                "en-GB",
                {
                    month: "short"
                }
            ).toUpperCase();


        let targetDay = null;


        const days =
            timeline.querySelectorAll(
                ".timeline-day"
            );


        days.forEach(
            timelineDay => {

                const timelineDate =
                    timelineDay.querySelector(
                        ".timeline-date strong"
                    )?.textContent.trim();


                const timelineMonth =
                    timelineDay.querySelector(
                        ".timeline-date span"
                    )?.textContent.trim();


                if (
                    timelineDate === day &&
                    timelineMonth === month
                ) {

                    targetDay =
                        timelineDay;

                }

            }
        );


        if (!targetDay) {

            targetDay =
                document.createElement(
                    "div"
                );


            targetDay.className =
                "timeline-day";


            targetDay.innerHTML = `

                <div class="timeline-date">

                    <strong>
                        ${day}
                    </strong>

                    <span>
                        ${month}
                    </span>

                </div>


                <div class="timeline-items"></div>

            `;


            timeline.appendChild(
                targetDay
            );

        }


        const item =
            document.createElement(
                "article"
            );


        item.className =
            "timeline-reminder";


        item.dataset.category =
            data.category;


        item.dataset.date =
            data.date;


        item.dataset.time =
            data.time;


        const timeParts =
            convertTime(data.time);


        item.innerHTML = `

            <div class="timeline-time">
                ${timeParts.time} ${timeParts.period}
            </div>


            <div
                class="timeline-category ${data.category}"
            >

                <span></span>

                ${data.category.toUpperCase()}

            </div>


            <div class="timeline-content">

                <strong></strong>

                <p></p>

            </div>


            <button
                class="timeline-edit"
                type="button"
            >
                Edit
            </button>

        `;


        item.querySelector(
            ".timeline-content strong"
        ).textContent =
            data.title;


        item.querySelector(
            ".timeline-content p"
        ).textContent =
            data.description ||
            "No description added.";


        item.querySelector(
            ".timeline-edit"
        ).addEventListener(
            "click",
            () => {

                editTimelineReminder(
                    item,
                    data
                );

            }
        );


        targetDay
            .querySelector(
                ".timeline-items"
            )
            .appendChild(item);

    }


    /* =====================================================
       EDIT TIMELINE
    ===================================================== */

    function editTimelineReminder(
        item,
        data
    ) {

        const updatedTitle =
            prompt(
                "Reminder title:",
                data.title
            );


        if (updatedTitle === null)
            return;


        const updatedTime =
            prompt(
                "Time (HH:MM):",
                data.time
            );


        if (updatedTime === null)
            return;


        const updatedDescription =
            prompt(
                "Description:",
                data.description ||
                ""
            );


        if (updatedDescription === null)
            return;


        data.title =
            updatedTitle.trim();


        data.time =
            updatedTime.trim();


        data.description =
            updatedDescription.trim();


        const timeParts =
            convertTime(
                data.time
            );


        item.querySelector(
            ".timeline-time"
        ).textContent =
            `${timeParts.time} ${timeParts.period}`;


        item.querySelector(
            ".timeline-content strong"
        ).textContent =
            data.title;


        item.querySelector(
            ".timeline-content p"
        ).textContent =
            data.description ||
            "No description added.";


        showToast(
            "Timeline reminder updated"
        );

    }


    $$(".timeline-edit")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            button.closest(
                                ".timeline-reminder"
                            );


                        if (!item)
                            return;


                        const title =
                            item.querySelector(
                                ".timeline-content strong"
                            )?.textContent ||
                            "";


                        const description =
                            item.querySelector(
                                ".timeline-content p"
                            )?.textContent ||
                            "";


                        const timeText =
                            item.querySelector(
                                ".timeline-time"
                            )?.textContent ||
                            "";


                        const updatedTitle =
                            prompt(
                                "Reminder title:",
                                title
                            );


                        if (
                            updatedTitle === null
                        )
                            return;


                        const updatedDescription =
                            prompt(
                                "Description:",
                                description
                            );


                        if (
                            updatedDescription === null
                        )
                            return;


                        item.querySelector(
                            ".timeline-content strong"
                        ).textContent =
                            updatedTitle.trim();


                        item.querySelector(
                            ".timeline-content p"
                        ).textContent =
                            updatedDescription.trim();


                        showToast(
                            "Reminder updated"
                        );

                    }
                );

            }
        );


    /* =====================================================
       REMINDER EVENTS
    ===================================================== */

    function attachReminderEvents(
        card
    ) {

        const completeButton =
            card.querySelector(
                ".complete-reminder"
            );


        const editButton =
            card.querySelector(
                ".edit-reminder"
            );


        const snoozeButton =
            card.querySelector(
                ".snooze-reminder"
            );


        completeButton?.addEventListener(
            "click",
            () => {

                completeReminder(
                    card
                );

            }
        );


        editButton?.addEventListener(
            "click",
            () => {

                editReminder(
                    card
                );

            }
        );


        snoozeButton?.addEventListener(
            "click",
            () => {

                snoozeReminder(
                    card
                );

            }
        );

    }


    /* =====================================================
       COMPLETE REMINDER
    ===================================================== */

    function completeReminder(
        card
    ) {

        const title =
            card.querySelector(
                "h3"
            )?.textContent ||
            "Reminder";


        card.dataset.status =
            "completed";


        const completedList =
            $("#completedReminderList");


        if (completedList) {

            const completed =
                document.createElement(
                    "article"
                );


            completed.className =
                "completed-reminder";


            const category =
                card.dataset.category ||
                "general";


            completed.dataset.category =
                category;


            completed.innerHTML = `

                <div class="completed-check">
                    ✓
                </div>

                <div class="completed-content">

                    <strong></strong>

                    <span>
                        ${category.toUpperCase()}
                        · Completed just now
                    </span>

                </div>

            `;


            completed.querySelector(
                "strong"
            ).textContent =
                title;


            completedList.prepend(
                completed
            );

        }


        card.style.transition =
            "opacity .25s ease, transform .25s ease";


        card.style.opacity =
            "0";


        card.style.transform =
            "translateX(20px)";


        setTimeout(
            () => {

                card.remove();

                updateCounts();

                showToast(
                    "Reminder completed"
                );

            },
            260
        );

    }


    /* =====================================================
       EDIT REMINDER
    ===================================================== */

    function editReminder(
        card
    ) {

        const currentTitle =
            card.querySelector(
                "h3"
            )?.textContent ||
            "";


        const currentDescription =
            card.querySelector(
                ".reminder-content > p"
            )?.textContent ||
            "";


        const newTitle =
            prompt(
                "Reminder title:",
                currentTitle
            );


        if (newTitle === null)
            return;


        const newDescription =
            prompt(
                "Description:",
                currentDescription
            );


        if (newDescription === null)
            return;


        card.querySelector(
            "h3"
        ).textContent =
            newTitle.trim();


        card.querySelector(
            ".reminder-content > p"
        ).textContent =
            newDescription.trim();


        showToast(
            "Reminder updated"
        );

    }


    /* =====================================================
       SNOOZE
    ===================================================== */

    function snoozeReminder(
        card
    ) {

        const title =
            card.querySelector(
                "h3"
            )?.textContent ||
            "Reminder";


        const choice =
            prompt(
                `Snooze "${title}" for how many minutes?`,
                "30"
            );


        if (choice === null)
            return;


        const minutes =
            Number(choice);


        if (
            !Number.isFinite(minutes) ||
            minutes <= 0
        ) {

            showToast(
                "Enter a valid number of minutes"
            );

            return;

        }


        const now =
            new Date();


        now.setMinutes(
            now.getMinutes() +
            minutes
        );


        const time =
            now.toLocaleTimeString(
                "en-US",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );


        showToast(
            `Reminder snoozed until ${time}`
        );

    }


    /* =====================================================
       INITIAL EVENT BINDINGS
    ===================================================== */

    $$(".reminder-card")
        .forEach(
            attachReminderEvents
        );


    /* =====================================================
       NAVIGATION FILTERS
    ===================================================== */

    let currentFilter =
        "all";


    $$(".remainder-nav-item")
        .forEach(
            nav => {

                nav.addEventListener(
                    "click",
                    () => {

                        $$(".remainder-nav-item")
                            .forEach(
                                item =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );


                        nav.classList.add(
                            "active"
                        );


                        currentFilter =
                            nav.dataset.filter ||
                            "all";


                        applyCurrentFilter();

                    }
                );

            }
        );


    function applyCurrentFilter() {

        const today =
            todayISO();


        const cards =
            $$(".reminder-card");


        cards.forEach(
            card => {

                const status =
                    card.dataset.status ||
                    "upcoming";


                const date =
                    card.dataset.date ||
                    "";


                let visible =
                    true;


                switch (
                    currentFilter
                ) {

                    case "today":

                        visible =
                            date === today;

                        break;


                    case "upcoming":

                        visible =
                            date > today &&
                            status !== "completed";

                        break;


                    case "overdue":

                        visible =
                            date < today &&
                            status !== "completed";

                        break;


                    case "completed":

                        visible =
                            status === "completed";

                        break;


                    default:

                        visible =
                            true;

                }


                card.style.display =
                    visible
                        ? ""
                        : "none";

            }
        );

    }


    /* =====================================================
       COUNTS
    ===================================================== */

    function updateCounts() {

        const today =
            todayISO();


        let todayCount =
            0;

        let upcomingCount =
            0;

        let overdueCount =
            0;

        let completedCount =
            $$(".completed-reminder")
                .length;


        $$(".reminder-card")
            .forEach(
                card => {

                    const date =
                        card.dataset.date ||
                        "";


                    const status =
                        card.dataset.status ||
                        "upcoming";


                    if (
                        status ===
                        "completed"
                    ) {

                        completedCount++;

                        return;

                    }


                    if (
                        date ===
                        today
                    ) {

                        todayCount++;

                    } else if (
                        date >
                        today
                    ) {

                        upcomingCount++;

                    } else if (
                        date <
                        today
                    ) {

                        overdueCount++;

                    }

                }
            );


        if ($("#todayCount"))
            $("#todayCount")
                .textContent =
                todayCount;


        if ($("#upcomingCount"))
            $("#upcomingCount")
                .textContent =
                upcomingCount;


        if ($("#overdueCount"))
            $("#overdueCount")
                .textContent =
                overdueCount;


        if ($("#completedCount"))
            $("#completedCount")
                .textContent =
                completedCount;


        const overdueLabel =
            $(".overdue-count");


        if (overdueLabel) {

            overdueLabel.textContent =
                `${overdueCount} ${
                    overdueCount === 1
                        ? "overdue"
                        : "overdue"
                }`;

        }

    }


    updateCounts();


    /* =====================================================
       CLEAR COMPLETED
    ===================================================== */

    $("#clearCompleted")
        ?.addEventListener(
            "click",
            () => {

                const completed =
                    $("#completedReminderList");


                if (!completed)
                    return;


                const items =
                    completed.querySelectorAll(
                        ".completed-reminder"
                    );


                if (!items.length) {

                    showToast(
                        "Nothing to clear"
                    );

                    return;

                }


                if (
                    !confirm(
                        "Clear completed reminders?"
                    )
                )
                    return;


                completed.innerHTML =
                    "";


                updateCounts();


                showToast(
                    "Completed reminders cleared"
                );

            }
        );


    /* =====================================================
       ADD TIMELINE REMINDER
    ===================================================== */

    $("#addTimelineReminder")
        ?.addEventListener(
            "click",
            () => {

                clearReminderForm();

                openModal(
                    reminderModal
                );

            }
        );


    /* =====================================================
       MODAL BACKDROP
    ===================================================== */

    [
        reminderModal,
        quickReminderModal
    ]
        .forEach(
            modal => {

                modal?.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            modal
                        ) {

                            closeModal(
                                modal
                            );

                        }

                    }
                );

            }
        );


    /* =====================================================
       ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            )
                return;


            closeModal(
                reminderModal
            );


            closeModal(
                quickReminderModal
            );

        }
    );


    /* =====================================================
       KEYBOARD SHORTCUT
       N = NEW REMINDER
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            const tag =
                document.activeElement?.tagName;


            if (
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT"
            )
                return;


            if (
                event.key.toLowerCase() ===
                "n"
            ) {

                clearReminderForm();

                openModal(
                    reminderModal
                );

            }

        }
    );


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    updateRelatedItems();

    updateCounts();

    applyCurrentFilter();

});