document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".project-form");

  form.addEventListener("submit", function (e) {
      e.preventDefault(); // Sahifa yangilanib ketmasligi uchun

      const projectData = {
          name: document.getElementById("project-name").value,
          description: document.getElementById("project-description").value,
          startDate: document.getElementById("start-date").value,
          endDate: document.getElementById("end-date").value,
          status: document.getElementById("status").value,
          responsible: document.getElementById("statusMasul").value,
      };

      fetch("http://localhost:5000/api/projects", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify(projectData),
      })
          .then((response) => response.json())
          .then((data) => {
              alert(data.message);
              form.reset(); // Formani tozalash
          })
          .catch((error) => console.error("Xatolik:", error));
  });
});
