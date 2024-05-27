document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.sync.get("loggedIn", function (data) {
    if (!data.loggedIn) {
      window.location.href = "login.html";
    } else {
      // Load the rest of your popup functionality here
      var keywords = "";
      chrome.storage.local.get("users", function (result) {
        document.getElementById("lasto").innerText = result.users;
        console.log(result.users);
        keywords = result.users;
      });

      function getDateString(nDate) {
        let nDateDate = nDate.getDate();
        let nDateMonth = nDate.getMonth() + 1;
        let nDateYear = nDate.getFullYear();
        if (nDateDate < 10) {
          nDateDate = "0" + nDateDate;
        }
        if (nDateMonth < 10) {
          nDateMonth = "0" + nDateMonth;
        }
        let presentDate = "" + nDateYear + "-" + nDateMonth + "-" + nDateDate;
        return presentDate;
      }

      function getDomain(tablink) {
        let url = tablink[0].url;
        return url.split("/")[2];
      }

      function secondsToString(seconds, compressed = false) {
        let hours = parseInt(seconds / 3600);
        seconds = seconds % 3600;
        let minutes = parseInt(seconds / 60);
        seconds = seconds % 60;
        let timeString = "";
        if (hours) {
          timeString += hours + " hrs ";
        }
        if (minutes) {
          timeString += minutes + " min ";
        }
        if (seconds) {
          timeString += seconds + " sec ";
        }
        if (!compressed) {
          return timeString;
        } else {
          if (hours) {
            return `${hours}h`;
          }
          if (minutes) {
            return `${minutes}m`;
          }
          if (seconds) {
            return `${seconds}s`;
          }
        }
      }
      var allKeys,
        timeSpent,
        totalTimeSpent,
        sortedTimeList,
        topCount,
        topDataSet,
        topLabels,
        dateChart;
      var color = [];

      totalTimeSpent = 0;
      var today = getDateString(new Date());

      fetchDataFromDatabase(today);

      function fetchDataFromDatabase(today) {
        chrome.storage.local.get("users", function (result) {
          fetch(
            `http://localhost:5500/fetch-data?date=${today}&users=${result.users}`
          )
            .then((response) => {
              if (!response.ok) {
                console.log("hii");
                throw new Error("Failed to fetch data from database");
              }
              return response.json();
            })
            .then((storedItems) => {
              console.log(storedItems);
              processStoredItems(storedItems);
            })
            .catch((error) => {
              console.error(error);
            });
        });
      }

      function updateRegistration(webURL, info) {
        chrome.storage.local.get("users", function (result) {
          let users=result.users;
        fetch("http://localhost:5500/update-registration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ webURL, info, users }), // Send info instead of action
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            console.log("Registration updated successfully");
          })
          .catch((error) => {
            console.error("Error updating database:", error);
          });
        });
      }

      function processStoredItems(storedItems) {
        allKeys = Object.keys(storedItems);
        timeSpent = [];
        sortedTimeList = [];
        fullysorteslist = [];
        totalTimeSpent = 0;
        let k = 0;
        const stauslist = {};
        for (let i = 0; i < allKeys.length; i++) {
          let webURL = allKeys[i];
          const randomColor =
            "#" + Math.floor(Math.random() * 16777215).toString(16);
          color.push(randomColor);
          if (storedItems[webURL].status !== "Ignore") {
            timeSpent.push(storedItems[webURL].time);
            totalTimeSpent += storedItems[webURL].time;
            sortedTimeList.push([webURL, storedItems[webURL].time]);
            k++;
          }
          fullysorteslist.push([webURL, storedItems[webURL].time]);
          stauslist[webURL] = storedItems[webURL].status;
        }
        console.log(sortedTimeList);
        sortedTimeList.sort((a, b) => b[1] - a[1]);
        fullysorteslist.sort((a, b) => b[1] - a[1]);
        topCount = allKeys.length > 10 ? 10 : allKeys.length;

        document.getElementById("totalTimeToday").innerText =
          secondsToString(totalTimeSpent);
        topDataSet = [];
        topLabels = [];
        for (let j = 0; j < k; j++) {
          topDataSet.push(sortedTimeList[j][1]);
          topLabels.push(sortedTimeList[j][0]);
        }

        const webTable = document.getElementById("webList");
        const webTable1 = document.getElementById("webList3");
        webTable.innerHTML = ""; // Clear previous data
        webTable.innerHTML = ""; // Clear previous data

        new Chart(document.getElementById("pie-chart"), {
          type: "bar",
          data: {
            labels: topLabels,
            datasets: [
              {
                label: "Time Spent",
                backgroundColor: color,
                data: topDataSet,
              },
            ],
          },
          options: {
            title: {
              display: true,
              text: "Top Visited Sites Today",
            },
            legend: {
              display: true,
            },
            circumference: Math.PI,
            rotation: Math.PI,
          },
        });

        for (let i = 0; i < allKeys.length; i++) {
          let webURL = fullysorteslist[i][0];
          let row = document.createElement("tr");
          let serialNumber = document.createElement("td");
          serialNumber.innerText = i + 1;
          let siteURL = document.createElement("td");
          siteURL.innerText = webURL;
          let siteTime = document.createElement("td");
          if (stauslist[fullysorteslist[i][0]] !== "Ignore")
            siteTime.innerText = secondsToString(fullysorteslist[i][1]);
          let info = document.createElement("td");
          let select = document.createElement("select");
          select.id = "year";
          let status = document.createElement("td");
          status.innerText = stauslist[fullysorteslist[i][0]];

          const options = ["Nil", "None", "Block", "Ignore"];

          for (let i = 0; i < 4; i++) {
            var option = document.createElement("option");
            option.text = option.value = options[i];
            select.add(option);
          }
          select.addEventListener("change", function (event) {
            if (select.value === "None") {
              updateRegistration(webURL, select.value);
              location.reload();
            } else if (select.value === "Block") {
              updateRegistration(webURL, select.value);
              location.reload();
            } else {
              updateRegistration(webURL, select.value);
              location.reload();
            }
          });
          info.appendChild(select);
          row.appendChild(serialNumber);
          row.appendChild(siteURL);
          row.appendChild(siteTime);
          row.appendChild(info);
          row.appendChild(status);
          if (status.innerText === "Block") {
            row.style.backgroundColor = "red";
          }
          if (status.innerText === "Ignore") {
            row.style.backgroundColor = "Yellow";
          }
          webTable.appendChild(row);
        }
        // for (let i = 0; i < allKeys.length; i++) {
        //   let webURL = sortedTimeList[i][0];
        //   let row = document.createElement("tr");
        //   let serialNumber = document.createElement("td");
        //   serialNumber.innerText = i + 1;
        //   let siteURL = document.createElement("td");
        //   siteURL.innerText = webURL;
        //   let siteTime = document.createElement("td");
        //   let info = document.createElement("td");
        //   let select = document.createElement("select");
        //   select.id = "year";
        //   const options = ["None", "Block", "Ignore"];
        //   for (let i = 0; i < 3; i++) {
        //     var option = document.createElement("option");
        //     option.text = option.value = options[i];
        //     select.add(option, 0);
        //   }
        //   info.appendChild(select);
        //   siteTime.innerText = secondsToString(sortedTimeList[i][1]);
        //   row.appendChild(serialNumber);
        //   row.appendChild(siteURL);
        //   row.appendChild(siteTime);
        //   row.appendChild(info);
        //   webTable1.appendChild(row);
        // }
      }

      document
        .getElementById("dateSubmit")
        .addEventListener("click", function () {
          const calendar = document.getElementById("dateValue");
          if (calendar.value === "") {
            document.getElementById("tryAgain").innerText =
              "Invalid date! Please try again .";
            document.getElementById("tryAgain").classList.remove("d-none");
          } else {
            document.getElementById("tryAgain").classList.add("d-none");
            let givenDate = calendar.value;

            function fetchDataForGivenDate(givenDate) {
              fetch(
                `http://localhost:5500/fetch-data-for-date?date=${givenDate}&users=${keywords}`
              )
                .then((response) => {
                  if (!response.ok) {
                    throw new Error("Failed to fetch data for the given date");
                  }
                  return response.json();
                })
                .then((thatDay) => {
                  if (!thatDay || Object.keys(thatDay).length === 0) {
                    document.getElementById("tryAgain").innerText =
                      "No records exist for this day!";
                    document
                      .getElementById("tryAgain")
                      .classList.remove("d-none");
                  } else {
                    processThatDayData(thatDay, givenDate);
                  }
                })
                .catch((error) => {
                  console.error(error);
                  document.getElementById("tryAgain").innerText =
                    "Failed to fetch data for this day!";
                  document
                    .getElementById("tryAgain")
                    .classList.remove("d-none");
                });
            }

            function processThatDayData(thatDay, givenDate) {
              console.log("hii");
              let sites = Object.keys(thatDay);
              let times = [];
              let colors = [];
              for (let i = 0; i < sites.length; i++) {
                times.push([sites[i], thatDay[sites[i]]]);
                const randomColor =
                  "#" + Math.floor(Math.random() * 16777215).toString(16);
                colors.push(randomColor);
              }
              times.sort(function (a, b) {
                return b[1] - a[1];
              });
              let topTen = times.length > 10 ? 10 : times.length;
              let dataSet = [];
              let thatDayTotal = 0;
              let dataSetLabels = [];
              for (let i = 0; i < topTen; i++) {
                dataSet.push(times[i][1]);
                dataSetLabels.push(times[i][0]);
                thatDayTotal += times[i][1];
              }
              let chartTitle = "Top Visited Sites on " + givenDate;
              if (dateChart) {
                dateChart.destroy();
              }
              dateChart = new Chart(
                document.getElementById("differentDayChart"),
                {
                  type: "pie",
                  data: {
                    labels: dataSetLabels,
                    datasets: [
                      {
                        label: "Time Spent",
                        backgroundColor: colors,
                        data: dataSet,
                      },
                    ],
                  },
                  options: {
                    title: {
                      display: true,
                      text: chartTitle,
                    },
                    legend: {
                      display: true,
                    },
                    // circumference: Math.PI,
                    // rotation: Math.PI,
                  },
                }
              );
              document.getElementById("statsRow").classList.remove("d-none");
              document.getElementById("totalTimeThatDay").innerText =
                secondsToString(thatDayTotal);
              const webList2 = document.getElementById("webList2");
              while (webList2.firstChild) {
                webList2.removeChild(webList2.lastChild);
              }
              for (let i = 0; i < times.length; i++) {
                let row = document.createElement("tr");
                let col1 = document.createElement("td");
                col1.innerText = i + 1;
                row.appendChild(col1);
                let col2 = document.createElement("td");
                col2.innerText = times[i][0];
                row.appendChild(col2);
                let col3 = document.createElement("td");
                col3.innerText = secondsToString(times[i][1]);
                row.appendChild(col3);
                webList2.appendChild(row);
              }
            }
            // Call this function to fetch data for the given date
            fetchDataForGivenDate(givenDate);
          }
        });
      function getDateTotalTime(storedObject, date) {
        let websiteLinks = Object.keys(storedObject[date]);
        let noOfWebsites = websiteLinks.length;
        let totalTime = 0;
        for (let i = 0; i < noOfWebsites; i++) {
          totalTime += storedObject[date][websiteLinks[i]];
        }
        return totalTime;
      }

      var monthNames = [
        "",
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      document.getElementById("weekTab").addEventListener("click", function () {
        fetch(`http://localhost:5500/fetch-weekly-data?users=${keywords}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch weekly data");
            }
            return response.json();
          })
          .then((data) => {
            let datesList = Object.keys(data);
            let noOfDays = datesList.length >= 7 ? 7 : datesList.length;
            let timeEachDay = [];
            let dateLabels = [];
            let weeksTotalTime = 0;
            datesList.sort();
            for (
              let i = datesList.length - noOfDays;
              i < datesList.length;
              i++
            ) {
              let month = datesList[i].split(" ");
              let label = datesList[i][8] + datesList[i][9] + " " + month[1];
              dateLabels.push(label);
              let dayTime = getDateTotalTime(data, datesList[i]);
              timeEachDay.push(dayTime);
              weeksTotalTime += dayTime;
            }
            let weeklyAverage = parseInt(weeksTotalTime / noOfDays);
            weeklyAverage = secondsToString(weeklyAverage);
            let weeklyMax = Math.max.apply(Math, timeEachDay);
            weeklyMax = secondsToString(weeklyMax);
            document.getElementById("weekAvg").innerText = weeklyAverage;
            document.getElementById("weekMax").innerText = weeklyMax;
            const weeklyChart = document.getElementById("pastWeek");
            let weeklyChartDetails = {};
            weeklyChartDetails["type"] = "bar";
            let dataObj = {};
            dataObj["labels"] = dateLabels;
            dataObj["datasets"] = [
              {
                label: "Time Spent",
                fill: true,
                backgroundColor: "rgba(75,192,192,0.4)",
                lineTension: 0.2,
                borderColor: "rgba(75,192,192,0.8)",
                pointBackgroundColor: "rgba(75,192,192,1)",
                data: timeEachDay,
              },
            ];
            weeklyChartDetails["data"] = dataObj;
            weeklyChartDetails["options"] = {
              legend: { display: false },
              title: {
                display: true,
                text: "Time Spent Online in the Recent Past",
              },
              scales: {
                yAxes: [
                  {
                    scaleLabel: {
                      display: true,
                      labelString: "Time in Seconds",
                    },
                  },
                ],
              },
            };
            new Chart(weeklyChart, weeklyChartDetails);
          })
          .catch((error) => {
            console.error(error);
          });
      });
    }
  });
});

// Send a message to the background script when logout is triggered
function logout() {
  chrome.runtime.sendMessage({ type: "logout" });
}

document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.sync.get("loggedIn", function (data) {
    if (!data.loggedIn) {
      window.location.href = "login.html";
    } else {
      // Existing functionality...

      document
        .getElementById("sign-out-btn")
        .addEventListener("click", function () {
          fetch("http://localhost:5500/sign-out", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
            .then((response) => {
              if (!response.ok) throw new Error("Failed to sign out");
              return response.json();
            })
            .then((data) => {
              if (data.success) {
                chrome.storage.sync.set({ loggedIn: false }, () => {
                  console.log("User signed out");
                  logout();
                  window.close();
                });
              }
            })
            .catch((error) => {
              console.error("Error signing out:", error);
            });
        });

      // Existing functionality...
    }
  });
});
