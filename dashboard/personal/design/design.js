/* =========================================================
   RiGiD — DESIGN WORKSPACE
   design.js
========================================================= */


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeNavigation();

    initializeSaveSystem();

    initializeTaskSystem();

    initializeNotesSystem();

    initializeButtons();

    initializeFileActions();

    initializeReferenceActions();

    initializeProgress();

});


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

    const backButton =
        document.getElementById("backButton");

    if (!backButton) {
        return;
    }


    backButton.addEventListener("click", () => {

        /*
         * Personal workspace page
         *
         * If design.html is inside:
         * personal/design/
         *
         * then ../personal.html
         * becomes:
         * ../personal.html
         */

        window.location.href = "../personal.html";

    });

}


/* =========================================================
   SAVE SYSTEM
========================================================= */

function initializeSaveSystem() {

    const saveButton =
        document.getElementById("saveButton");

    const notes =
        document.getElementById("designNotes");

    const notesSaved =
        document.getElementById("notesSaved");


    if (!saveButton) {
        return;
    }


    saveButton.addEventListener("click", () => {

        saveDesignData();

        showSaveFeedback(
            saveButton,
            "Saved"
        );


        if (notesSaved) {

            notesSaved.textContent =
                getCurrentTime();

        }

    });


    /*
     * Ctrl + S / Cmd + S
     */

    document.addEventListener("keydown", (event) => {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "s"
        ) {

            event.preventDefault();

            saveDesignData();

            showSaveFeedback(
                saveButton,
                "Saved"
            );


            if (notesSaved) {

                notesSaved.textContent =
                    getCurrentTime();

            }

        }

    });


    /*
     * Auto-save notes locally while typing.
     */

    if (notes) {

        notes.addEventListener(
            "input",
            debounce(() => {

                localStorage.setItem(
                    "rigid_design_notes",
                    notes.value
                );

                if (notesSaved) {

                    notesSaved.textContent =
                        "Draft";

                }

            }, 500)
        );

    }


    /*
     * Restore previous notes.
     */

    if (notes) {

        const storedNotes =
            localStorage.getItem(
                "rigid_design_notes"
            );

        if (storedNotes !== null) {

            notes.value =
                storedNotes;

        }

    }

}


/* =========================================================
   SAVE DESIGN DATA
========================================================= */

function saveDesignData() {

    const notes =
        document.getElementById("designNotes");

    const tasks =
        document.querySelectorAll(
            "#taskList input[type='checkbox']"
        );


    const taskState =
        Array.from(tasks).map(
            checkbox => checkbox.checked
        );


    const designData = {

        version:
            document.getElementById(
                "designVersion"
            )?.textContent || "v1.4",

        notes:
            notes?.value || "",

        tasks:
            taskState,

        savedAt:
            new Date().toISOString()

    };


    localStorage.setItem(
        "rigid_design_data",
        JSON.stringify(designData)
    );

}


/* =========================================================
   SAVE FEEDBACK
========================================================= */

function showSaveFeedback(
    button,
    message
) {

    if (!button) {
        return;
    }


    const originalText =
        button.textContent;


    button.textContent =
        message;


    button.disabled = true;


    setTimeout(() => {

        button.textContent =
            originalText;

        button.disabled = false;

    }, 1200);

}


/* =========================================================
   TASK SYSTEM
========================================================= */

function initializeTaskSystem() {

    const taskList =
        document.getElementById("taskList");

    if (!taskList) {
        return;
    }


    const checkboxes =
        taskList.querySelectorAll(
            "input[type='checkbox']"
        );


    checkboxes.forEach((checkbox) => {

        checkbox.addEventListener(
            "change",
            () => {

                updateTaskState(
                    checkbox
                );

                updateTaskSummary();

                saveDesignData();

            }
        );

    });


    /*
     * Restore task states
     */

    restoreTaskState();

    updateTaskSummary();

}


/* =========================================================
   UPDATE SINGLE TASK
========================================================= */

function updateTaskState(
    checkbox
) {

    const task =
        checkbox.closest(".task-item");

    if (!task) {
        return;
    }


    const state =
        task.querySelector(".task-state");


    if (checkbox.checked) {

        task.classList.add(
            "completed"
        );


        if (state) {

            state.textContent =
                "DONE";

        }

    } else {

        task.classList.remove(
            "completed"
        );


        if (state) {

            state.textContent =
                "TODO";

        }

    }

}


/* =========================================================
   UPDATE TASK SUMMARY
========================================================= */

function updateTaskSummary() {

    const checkboxes =
        document.querySelectorAll(
            "#taskList input[type='checkbox']"
        );


    if (!checkboxes.length) {
        return;
    }


    const completed =
        Array.from(checkboxes)
            .filter(
                checkbox => checkbox.checked
            )
            .length;


    const total =
        checkboxes.length;


    const remaining =
        total - completed;


    const percentage =
        Math.round(
            (completed / total) * 100
        );


    /*
     * Main summary
     */

    const taskSummary =
        document.getElementById(
            "taskSummary"
        );


    if (taskSummary) {

        taskSummary.textContent =
            `${completed} / ${total}`;

    }


    /*
     * Task statistics
     */

    const statBoxes =
        document.querySelectorAll(
            ".task-stat-grid strong"
        );


    if (statBoxes.length >= 4) {

        statBoxes[0].textContent =
            completed;

        statBoxes[1].textContent =
            remaining;

        statBoxes[2].textContent =
            0;

        statBoxes[3].textContent =
            total;

    }


    /*
     * Task progress bar
     */

    const taskProgress =
        document.querySelector(
            ".task-progress-fill"
        );


    if (taskProgress) {

        taskProgress.style.width =
            `${percentage}%`;

    }


    /*
     * Update task progress label
     */

    const progressLabel =
        document.querySelector(
            ".task-progress-top strong"
        );


    if (progressLabel) {

        progressLabel.textContent =
            `${completed} / ${total}`;

    }

}


/* =========================================================
   RESTORE TASK STATE
========================================================= */

function restoreTaskState() {

    const storedData =
        localStorage.getItem(
            "rigid_design_data"
        );


    if (!storedData) {
        return;
    }


    try {

        const data =
            JSON.parse(
                storedData
            );


        if (
            !data.tasks ||
            !Array.isArray(data.tasks)
        ) {

            return;

        }


        const checkboxes =
            document.querySelectorAll(
                "#taskList input[type='checkbox']"
            );


        checkboxes.forEach(
            (checkbox, index) => {

                if (
                    typeof data.tasks[index] ===
                    "boolean"
                ) {

                    checkbox.checked =
                        data.tasks[index];

                    updateTaskState(
                        checkbox
                    );

                }

            }
        );


    } catch (error) {

        console.warn(
            "Unable to restore design task state.",
            error
        );

    }

}


/* =========================================================
   NOTES SYSTEM
========================================================= */

function initializeNotesSystem() {

    const notes =
        document.getElementById(
            "designNotes"
        );


    if (!notes) {
        return;
    }


    /*
     * Character counter can be added later.
     *
     * Keep this lightweight for now.
     */

    notes.addEventListener(
        "keydown",
        (event) => {

            /*
             * Prevent accidental form-like
             * behavior if Enter is used.
             */

            if (
                event.key === "Tab"
            ) {

                event.preventDefault();

                const start =
                    notes.selectionStart;

                const end =
                    notes.selectionEnd;


                notes.value =
                    notes.value.substring(
                        0,
                        start
                    ) +
                    "    " +
                    notes.value.substring(
                        end
                    );


                notes.selectionStart =
                    notes.selectionEnd =
                        start + 4;

            }

        }
    );

}


/* =========================================================
   BUTTON SYSTEM
========================================================= */

function initializeButtons() {

    /*
     * More button
     */

    const moreButton =
        document.getElementById(
            "moreButton"
        );


    if (moreButton) {

        moreButton.addEventListener(
            "click",
            () => {

                showMoreMenu(
                    moreButton
                );

            }
        );

    }


    /*
     * Archive
     */

    const archiveButton =
        document.getElementById(
            "archiveButton"
        );


    if (archiveButton) {

        archiveButton.addEventListener(
            "click",
            () => {

                const confirmArchive =
                    window.confirm(
                        "Archive this design?"
                    );


                if (!confirmArchive) {
                    return;
                }


                setDesignStatus(
                    "ARCHIVED"
                );


                archiveButton.textContent =
                    "Archived";

            }
        );

    }


    /*
     * Complete
     */

    const completeButton =
        document.getElementById(
            "completeButton"
        );


    if (completeButton) {

        completeButton.addEventListener(
            "click",
            () => {

                const confirmComplete =
                    window.confirm(
                        "Mark this design as complete?"
                    );


                if (!confirmComplete) {
                    return;
                }


                setDesignStatus(
                    "COMPLETED"
                );


                completeButton.textContent =
                    "Completed";

            }
        );

    }


    /*
     * Add buttons
     */

    const addButtons =
        document.querySelectorAll(
            ".card-add-button"
        );


    addButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showTemporaryMessage(
                        "Add functionality will be connected to the design database later."
                    );

                }
            );

        }
    );


    /*
     * Section action buttons
     */

    const sectionActions =
        document.querySelectorAll(
            ".section-action"
        );


    sectionActions.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const action =
                        button.textContent.trim();


                    showTemporaryMessage(
                        `${action} — functionality ready to connect.`
                    );

                }
            );

        }
    );

}


/* =========================================================
   MORE MENU
========================================================= */

function showMoreMenu(
    button
) {

    /*
     * Remove existing menu
     */

    const existingMenu =
        document.querySelector(
            ".design-more-menu"
        );


    if (existingMenu) {

        existingMenu.remove();

        return;

    }


    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "design-more-menu";


    menu.innerHTML = `

        <button type="button"
                data-action="duplicate">
            Duplicate Design
        </button>

        <button type="button"
                data-action="export">
            Export Record
        </button>

        <button type="button"
                data-action="reset">
            Reset Local Data
        </button>

    `;


    /*
     * Minimal inline styling so
     * no additional CSS is required
     * for functionality.
     */

    Object.assign(
        menu.style,
        {

            position: "fixed",

            zIndex: "999",

            minWidth: "165px",

            padding: "5px",

            border:
                "1px solid rgba(139,92,246,0.28)",

            borderRadius: "8px",

            background:
                "rgba(15,17,29,0.98)",

            boxShadow:
                "0 15px 40px rgba(0,0,0,0.4)",

            backdropFilter:
                "blur(15px)"

        }
    );


    const rect =
        button.getBoundingClientRect();


    menu.style.top =
        `${rect.bottom + 7}px`;


    menu.style.right =
        `${window.innerWidth - rect.right}px`;


    document.body.appendChild(
        menu
    );


    /*
     * Menu actions
     */

    menu.querySelectorAll(
        "button"
    ).forEach(
        item => {

            Object.assign(
                item.style,
                {

                    display: "block",

                    width: "100%",

                    padding: "9px 10px",

                    border: "none",

                    borderRadius: "5px",

                    background: "transparent",

                    color: "#aaa6b9",

                    textAlign: "left",

                    fontSize: "9px",

                    cursor: "pointer"

                }
            );


            item.addEventListener(
                "mouseenter",
                () => {

                    item.style.background =
                        "rgba(139,92,246,0.10)";

                    item.style.color =
                        "#ddd6fe";

                }
            );


            item.addEventListener(
                "mouseleave",
                () => {

                    item.style.background =
                        "transparent";

                    item.style.color =
                        "#aaa6b9";

                }
            );


            item.addEventListener(
                "click",
                () => {

                    handleMoreAction(
                        item.dataset.action
                    );

                    menu.remove();

                }
            );

        }
    );


    /*
     * Close menu when clicking elsewhere
     */

    setTimeout(() => {

        document.addEventListener(
            "click",
            function closeMenu(event) {

                if (
                    !menu.contains(event.target) &&
                    event.target !== button
                ) {

                    menu.remove();

                    document.removeEventListener(
                        "click",
                        closeMenu
                    );

                }

            }
        );

    }, 0);

}


/* =========================================================
   MORE MENU ACTIONS
========================================================= */

function handleMoreAction(
    action
) {

    switch (action) {

        case "duplicate":

            showTemporaryMessage(
                "Design duplication will be connected later."
            );

            break;


        case "export":

            exportDesignRecord();

            break;


        case "reset":

            resetDesignData();

            break;


        default:

            break;

    }

}


/* =========================================================
   EXPORT DESIGN RECORD
========================================================= */

function exportDesignRecord() {

    const notes =
        document.getElementById(
            "designNotes"
        )?.value || "";


    const title =
        document.getElementById(
            "designTitle"
        )?.textContent.trim() ||
        "Design";


    const data = {

        title,

        code:
            document.getElementById(
                "designCode"
            )?.textContent.trim(),

        version:
            document.getElementById(
                "designVersion"
            )?.textContent.trim(),

        status:
            document.getElementById(
                "designStatus"
            )?.textContent.trim(),

        progress:
            document.getElementById(
                "progressValue"
            )?.textContent.trim(),

        notes,

        exportedAt:
            new Date().toISOString()

    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    4
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "rigid-design-record.json";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );


    showTemporaryMessage(
        "Design record exported."
    );

}


/* =========================================================
   RESET LOCAL DATA
========================================================= */

function resetDesignData() {

    const confirmed =
        window.confirm(
            "Reset locally saved design data? This cannot be undone."
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        "rigid_design_data"
    );


    localStorage.removeItem(
        "rigid_design_notes"
    );


    window.location.reload();

}


/* =========================================================
   FILE ACTIONS
========================================================= */

function initializeFileActions() {

    const fileButtons =
        document.querySelectorAll(
            ".file-action"
        );


    fileButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();


                    const fileCard =
                        button.closest(
                            ".file-card"
                        );


                    if (!fileCard) {
                        return;
                    }


                    const fileName =
                        fileCard.querySelector(
                            ".file-content strong"
                        )?.textContent.trim();


                    showTemporaryMessage(
                        `${fileName || "File"} — file opening will be connected later.`
                    );

                }
            );

        }
    );

}


/* =========================================================
   REFERENCE ACTIONS
========================================================= */

function initializeReferenceActions() {

    const references =
        document.querySelectorAll(
            ".reference-item"
        );


    references.forEach(
        reference => {

            reference.addEventListener(
                "click",
                (event) => {

                    /*
                     * Current href values are "#".
                     * Prevent browser jumping to top.
                     */

                    if (
                        reference.getAttribute(
                            "href"
                        ) === "#"
                    ) {

                        event.preventDefault();

                        const title =
                            reference.querySelector(
                                "strong"
                            )?.textContent.trim();


                        showTemporaryMessage(
                            `${title || "Reference"} — link will be connected later.`
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   PROGRESS SYSTEM
========================================================= */

function initializeProgress() {

    const progressBar =
        document.getElementById(
            "progressBar"
        );

    const progressValue =
        document.getElementById(
            "progressValue"
        );

    const progressRing =
        document.getElementById(
            "progressRing"
        );


    if (
        !progressBar ||
        !progressValue ||
        !progressRing
    ) {

        return;

    }


    const value =
        parseInt(
            progressValue.textContent,
            10
        );


    if (
        Number.isNaN(value)
    ) {

        return;

    }


    const safeValue =
        Math.min(
            100,
            Math.max(
                0,
                value
            )
        );


    progressBar.style.width =
        `${safeValue}%`;


    progressRing.style.background =
        `
        conic-gradient(
            #8b5cf6 ${safeValue}%,
            rgba(255,255,255,0.055) ${safeValue}%
        )
        `;

}


/* =========================================================
   DESIGN STATUS
========================================================= */

function setDesignStatus(
    status
) {

    const statusElement =
        document.getElementById(
            "designStatus"
        );


    if (!statusElement) {
        return;
    }


    statusElement.textContent =
        status;


    statusElement.classList.remove(
        "status-ongoing"
    );


    /*
     * Completed / archived states
     */

    if (status === "COMPLETED") {

        statusElement.style.color =
            "#4ade80";

        statusElement.style.borderColor =
            "rgba(74,222,128,0.24)";

        statusElement.style.background =
            "rgba(74,222,128,0.09)";

    }


    if (status === "ARCHIVED") {

        statusElement.style.color =
            "#aaa6b9";

        statusElement.style.borderColor =
            "rgba(255,255,255,0.10)";

        statusElement.style.background =
            "rgba(255,255,255,0.04)";

    }

}


/* =========================================================
   TEMPORARY MESSAGE
========================================================= */

function showTemporaryMessage(
    message
) {

    /*
     * Remove existing notification
     */

    const existing =
        document.querySelector(
            ".design-toast"
        );


    if (existing) {

        existing.remove();

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "design-toast";


    toast.textContent =
        message;


    Object.assign(
        toast.style,
        {

            position: "fixed",

            left: "50%",

            bottom: "24px",

            transform:
                "translateX(-50%)",

            zIndex: "9999",

            maxWidth:
                "min(90vw, 500px)",

            padding:
                "10px 14px",

            border:
                "1px solid rgba(139,92,246,0.35)",

            borderRadius:
                "8px",

            background:
                "rgba(15,17,29,0.96)",

            color:
                "#c4b5fd",

            fontFamily:
                '"Inter", sans-serif',

            fontSize:
                "9px",

            lineHeight:
                "1.4",

            boxShadow:
                "0 15px 40px rgba(0,0,0,0.4)",

            backdropFilter:
                "blur(15px)",

            opacity: "0",

            transition:
                "opacity 0.2s ease"

        }
    );


    document.body.appendChild(
        toast
    );


    requestAnimationFrame(() => {

        toast.style.opacity =
            "1";

    });


    setTimeout(() => {

        toast.style.opacity =
            "0";


        setTimeout(() => {

            toast.remove();

        }, 200);

    }, 2300);

}


/* =========================================================
   CURRENT TIME
========================================================= */

function getCurrentTime() {

    return new Date().toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   DEBOUNCE
========================================================= */

function debounce(
    callback,
    delay
) {

    let timeout;


    return function (...args) {

        clearTimeout(
            timeout
        );


        timeout =
            setTimeout(
                () => {

                    callback.apply(
                        this,
                        args
                    );

                },
                delay
            );

    };

}


/* =========================================================
   PAGE EXIT WARNING
========================================================= */

let hasUnsavedChanges = false;


/* =========================================================
   TRACK NOTES CHANGES
========================================================= */

const notesElement =
    document.getElementById(
        "designNotes"
    );


if (notesElement) {

    notesElement.addEventListener(
        "input",
        () => {

            hasUnsavedChanges =
                true;

        }
    );

}


/* =========================================================
   SAVE BUTTON CLEARS UNSAVED STATE
========================================================= */

const saveElement =
    document.getElementById(
        "saveButton"
    );


if (saveElement) {

    saveElement.addEventListener(
        "click",
        () => {

            hasUnsavedChanges =
                false;

        }
    );

}


/* =========================================================
   BEFORE UNLOAD
========================================================= */

window.addEventListener(
    "beforeunload",
    (event) => {

        if (!hasUnsavedChanges) {
            return;
        }


        event.preventDefault();

        event.returnValue = "";

    }
);


/* =========================================================
   CONSOLE
========================================================= */

console.log(
    "%cRiGiD Design Workspace",
    "color:#a78bfa;font-weight:bold;font-size:14px;"
);

console.log(
    "%cDesign workspace initialized.",
    "color:#aaa6b9;font-size:10px;"
);