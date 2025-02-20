document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".project-form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("project-name").value;
        const description = document.getElementById("project-description").value;
        const startDate = document.getElementById("start-date").value;
        const endDate = document.getElementById("end-date").value;
        const status = document.getElementById("status").value;
        const responsible = document.getElementById("statusMasul").value;

        if (!name || !description || !startDate || !endDate || !status || !responsible) {
            alert("Iltimos, barcha maydonlarni to‘ldiring!");
            return;
        }

        const projectData = { name, description, startDate, endDate, status, responsible };

        try {
            const response = await fetch("http://localhost:5000/api/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(projectData)
            });

            const data = await response.json();
            alert(data.message);

            form.reset(); // Formani tozalash
        } catch (error) {
            console.error("Xatolik:", error);
            alert("Serverga ulanishda xatolik yuz berdi!");
        }
    });
});
