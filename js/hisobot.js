document.addEventListener("DOMContentLoaded", function () {
    // LocalStorage'dan loyihalarni olish
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
  
    // Statistik ma'lumotlarni hisoblash
    const stats = {
      umumiy: projects.length,
      aktiv: 0,
      bajarilayotgan: 0,
      rejalashtirilgan: 0,
      toxtatilgan: 0,
      yakunlangan: 0,
    };
  
    projects.forEach((project) => {
      switch (project.status) {
        case "rejalashtirilmoqda":
          stats.rejalashtirilgan++;
          stats.aktiv++;
          break;
        case "bajarilmoqda":
          stats.bajarilayotgan++;
          stats.aktiv++;
          break;
        case "to'xtatildi":
          stats.toxtatilgan++;
          break;
        case "yakunlandi":
          stats.yakunlangan++;
          break;
        default:
          break;
      }
    });
  
    // Hisobotlarni yangilash
    document.querySelectorAll(".report-card").forEach((card) => {
      const title = card.querySelector("h3").innerText.toLowerCase();
  
      if (title.includes("umumiy")) {
        card.querySelector(".report-count").innerText = `${stats.umumiy} ta`;
      } else if (title.includes("aktiv")) {
        card.querySelector(".report-count").innerText = `${stats.aktiv} ta`;
      } else if (title.includes("bajarilayotgan")) {
        card.querySelector(".report-count").innerText = `${stats.bajarilayotgan} ta`;
      } else if (title.includes("rejalashtirilgan")) {
        card.querySelector(".report-count").innerText = `${stats.rejalashtirilgan} ta`;
      } else if (title.includes("to'xtatilgan")) {
        card.querySelector(".report-count").innerText = `${stats.toxtatilgan} ta`;
      } else if (title.includes("yakunlangan")) {
        card.querySelector(".report-count").innerText = `${stats.yakunlangan} ta`;
      }
    });
  });
  