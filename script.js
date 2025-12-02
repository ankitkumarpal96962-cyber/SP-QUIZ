// Button Click Event Listeners
document.getElementById("calcBtn").addEventListener("click", calculateBMI);
document.getElementById("resetBtn").addEventListener("click", resetForm);

// Main BMI Function
function calculateBMI() {
    const height = parseFloat(document.getElementById("height").value);
    const weight = parseFloat(document.getElementById("weight").value);

    const resultBox = document.getElementById("result");
    const bmiValueSpan = document.getElementById("bmiValue");
    const bmiStatusSpan = document.getElementById("bmiStatus");
    const bmiMessageP = document.getElementById("bmiMessage");

    // Validation
    if (!height || !weight || height <= 0 || weight <= 0) {
        alert("Please enter valid height and weight!");
        return;
    }

    // BMI Calculation
    const heightMeters = height / 100;
    const bmi = weight / (heightMeters * heightMeters);
    const bmiRounded = bmi.toFixed(1);

    let status = "";
    let mainMsg = "";
    let tips = "";
    let statusClass = "";

    // Conditions
    if (bmi < 18.5) {
        status = "Underweight";
        mainMsg = "You are below the healthy weight range.";
        tips =
            "✔ High-protein diet: Paneer, eggs, chicken, dal, peanut butter<br>" +
            "✔ Banana shake + dry fruits daily<br>" +
            "✔ 3–4 balanced meals every day<br>" +
            "✔ Strength training for muscle gain";
        statusClass = "status-underweight";

    } else if (bmi >= 18.5 && bmi < 25) {
        status = "Normal weight";
        mainMsg = "Your BMI is perfectly healthy!";
        tips =
            "✔ Maintain a balanced diet<br>" +
            "✔ Regular exercise (20–30 minutes)<br>" +
            "✔ Avoid junk food<br>" +
            "✔ 7–8 hrs proper sleep";
        statusClass = "status-normal";

    } else if (bmi >= 25 && bmi < 30) {
        status = "Overweight";
        mainMsg = "Your weight is slightly above normal.";
        tips =
            "✔ 30 minutes brisk walk or jogging daily<br>" +
            "✔ Avoid oily and sugary foods<br>" +
            "✔ Eat more fruits & vegetables<br>" +
            "✔ Drink more water<br>" +
            "✔ Try cycling, skipping, or yoga";
        statusClass = "status-overweight";

    } else {
        status = "Obese";
        mainMsg = "Your BMI is high. You need lifestyle changes.";
        tips =
            "✔ 45 minutes walk/jog mandatory daily<br>" +
            "✔ Sugary foods, cold drinks, fried food avoid kare<br>" +
            "✔ Protein-rich + low-carb diet follow karo<br>" +
            "✔ Climbing stairs, cycling, yoga helpful<br>" +
            "✔ If possible, consult a dietician";
        statusClass = "status-obese";
    }

    // Clear old classes
    resultBox.classList.remove(
        "status-underweight",
        "status-normal",
        "status-overweight",
        "status-obese",
        "hidden"
    );

    // Add new class
    resultBox.classList.add(statusClass);

    // Update Results
    bmiValueSpan.textContent = bmiRounded;
    bmiStatusSpan.textContent = status;

    bmiMessageP.innerHTML = `
        ${mainMsg}<br><br>
        <strong>What to do:</strong><br>${tips}
    `;
}

// Reset Function
function resetForm() {
    document.getElementById("height").value = "";
    document.getElementById("weight").value = "";

    const resultBox = document.getElementById("result");
    resultBox.classList.add("hidden");
    resultBox.classList.remove(
        "status-underweight",
        "status-normal",
        "status-overweight",
        "status-obese"
    );
}
