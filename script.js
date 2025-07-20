const dayCounter = document.getElementById('day-counter');
const taskList = document.getElementById('task-list');
const logBox = document.getElementById('log-box');
const actionButtonsContainer = document.getElementById('action-buttons');
const doNothingBtn = document.getElementById('do-nothing-btn');

let gameState = {
    day: 1,
    tasks: [
        { name: "Mow the lawn", daysSinceDone: 30, state: "overgrown" },
        { name: "Do the dishes", daysSinceDone: 2, state: "piling up" },
        { name: "Take out the trash", daysSinceDone: 4, state: "overflowing" },
        { name: "Fix the leaky faucet", daysSinceDone: 60, state: "drip... drip... drip..." }
    ],
    log: []
};

function render() {
    dayCounter.textContent = gameState.day;

    taskList.innerHTML = '';
    gameState.tasks.forEach(task => {
        const li = document.createElement('li');
        li.textContent = `${task.name}: ${task.state} (Last done ${task.daysSinceDone} days ago)`;
        taskList.appendChild(li);
    });

    logBox.innerHTML = '';
    gameState.log.slice().reverse().forEach(entry => {
        const p = document.createElement('p');
        p.innerHTML = entry;
        logBox.appendChild(p);
    });
    logBox.scrollTop = 0; // Scroll to top to see latest entry

    actionButtonsContainer.innerHTML = '';
    gameState.tasks.forEach(task => {
        const button = document.createElement('button');
        button.textContent = `Lazily ${task.name}`;
        button.dataset.task = task.name;
        button.addEventListener('click', handleUserAction);
        actionButtonsContainer.appendChild(button);
    });
}

function addLog(actor, message) {
    gameState.log.push(`<strong>Day ${gameState.day} - ${actor}:</strong> ${message}`);
}

async function handleUserAction(event) {
    const taskName = event.target.dataset.task;
    const task = gameState.tasks.find(t => t.name === taskName);
    
    setControls(false); // Disable buttons
    
    addLog("You", `You decide to lazily ${task.name}. It's better than nothing... probably.`);
    task.daysSinceDone = 0;
    
    await endTurn();
}

async function doNothing() {
    setControls(false); // Disable buttons
    addLog("You", "You stare blankly into space, achieving peak laziness.");
    await endTurn();
}

async function robotTurn() {
    const systemPrompt = `You are a lazy robot. You live with a lazy human.
Your goal is to do the absolute minimum to keep the house from falling apart.
You will be given the current state of chores as JSON.
You must decide on one action to take. The available actions are the chore names, or "Do Nothing".
Respond with a JSON object containing your 'action' and a 'thought' process for your decision, from a lazy robot's perspective.
Your thought should be short and funny.
Example response:
{
  "action": "Do the dishes",
  "thought": "The human might trip on the pile. That would be noisy. I will grudgingly move some plates around."
}`;

    const completion = await websim.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(gameState.tasks) }
        ],
        json: true
    });

    const result = JSON.parse(completion.content);
    const robotAction = result.action;
    const robotThought = result.thought;
    
    addLog("Lazy Robot", robotThought);

    if (robotAction !== "Do Nothing") {
        const task = gameState.tasks.find(t => t.name === robotAction);
        if (task) {
            task.daysSinceDone = 0;
        }
    }
}

function updateTaskStates() {
    gameState.tasks.forEach(task => {
        if (task.name === "Mow the lawn") {
            if (task.daysSinceDone > 90) task.state = "a jungle";
            else if (task.daysSinceDone > 30) task.state = "overgrown";
            else task.state = "looks okay, I guess";
        }
        if (task.name === "Do the dishes") {
            if (task.daysSinceDone > 7) task.state = "sentient mold forming";
            else if (task.daysSinceDone > 2) task.state = "piling up";
            else task.state = "mostly clean";
        }
        if (task.name === "Take out the trash") {
            if (task.daysSinceDone > 10) task.state = "attracting raccoons";
            else if (task.daysSinceDone > 3) task.state = "overflowing";
            else task.state = "has room";
        }
        if (task.name === "Fix the leaky faucet") {
            if (task.daysSinceDone > 100) task.state = "supplying the local water table";
            else if (task.daysSinceDone > 30) task.state = "drip... drip... drip...";
            else task.state = "fixed... for now";
        }
    });
}

function setControls(enabled) {
    const buttons = actionButtonsContainer.querySelectorAll('button');
    buttons.forEach(b => b.disabled = !enabled);
    doNothingBtn.disabled = !enabled;
}

async function endTurn() {
    await robotTurn();
    
    gameState.day++;
    gameState.tasks.forEach(t => t.daysSinceDone++);
    updateTaskStates();

    render();
    setControls(true); // Re-enable buttons for the next turn
}

function init() {
    addLog("System", "The adventure in laziness begins. Try not to let the house collapse.");
    doNothingBtn.addEventListener('click', doNothing);
    updateTaskStates();
    render();
}

init();

