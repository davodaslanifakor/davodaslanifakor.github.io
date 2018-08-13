const addItems = document.querySelector("#addItem");
const itemsList = document.querySelector(".todos");
const items = JSON.parse(localStorage.getItem("items")) || [];
const filtrDone = document.querySelector(".done");
const filtrDoing = document.querySelector(".doing");
const filtrAll = document.querySelector(".all");
const allItem = JSON.parse(localStorage.getItem("items"));
var activeFilter = localStorage.getItem("filter") || "all";
const activeElemnt = document.querySelector(`.${activeFilter}`);
const activeClass = document.querySelectorAll(".action-filter");

function addItem(e) {
  e.preventDefault();
  const text = this.querySelector("[name=item]").value;
  if (!lengthString(text)) return;
  const item = {
    text,
    isEdit: false,
    done: false
  };
  items.push(item);
  populateList(items, itemsList, activeFilter);
  localStorage.setItem("items", JSON.stringify(items));
  this.reset();
}
function populateList(plates = [], platesList, filterBy) {
  let list = [...plates];
  platesList.innerHTML = list
    .map((plate, i) => {
      return `
        <li class="flex-row ${filterBy == "all" ? "event-all" : ""} ${
        filterBy == "done" && plate.done ? "event-done" : ""
      } ${filterBy == "doing" && !plate.done ? "event-doing" : ""} ">
            <input type="text" value="${plate.text}" data-index="${i}" class="${
        !plate.isEdit ? "d-none" : "focus-active"
      } mr-auto inputItem align-self-center w-100"/>
            <p data-index="${i}"  class="itemText mr-auto align-self-center pointer w-100 ${
        plate.isEdit ? "d-none" : ""
      }">
              ${plate.text}
            </p>
            <button data-index="${i}" class="removeItem btn-icon align-self-center pointer flaticon-delete-button"></button>
            <button data-index="${i}" class="checkItem btn-icon align-self-center pointer ${
        !plate.done ? "flaticon-verified" : "flaticon-success"
      }"></button>
        </li>
        `;
    })
    .join("");
  focusElment();
}
function focusElment(plate, i) {
  const itemInput = document.querySelectorAll(".focus-active");
  if (itemInput.length <= 0) return;
  itemInput[0].select();
}
function handelEvent(e) {
  if (e.keyCode == 27) {
    editeTitle(e);
    return;
  }
  if (e.keyCode == 13) {
    saveItems(e);
    return;
  }
  if (e.target.classList.contains("checkItem")) {
    toggleDone(e);
    return;
  }
  if (e.target.classList.contains("removeItem")) {
    removeEvent(e);
    return;
  }
  if (e.target.classList.contains("itemText")) {
    editeTitle(e);
    return;
  }
}
function editeTitle(e) {
  const el = e.target;
  const index = el.dataset.index;
  items[index].isEdit = !items[index].isEdit;
  localStorage.setItem("items", JSON.stringify(items));
  populateList(items, itemsList, activeFilter);
}
function lengthString(value) {
  if (!value.replace(/\s/g, "").length) {
    alert("input is in empty");
  }
  return value.replace(/\s/g, "").length;
}
function saveItems(e) {
  const el = e.target;
  const index = el.dataset.index;
  if (!lengthString(e.target.value)) return;
  items[index].text = e.target.value;
  localStorage.setItem("items", JSON.stringify(items));
  populateList(items, itemsList, activeFilter);
  editeTitle(e);
}
function removeEvent(e) {
  const el = e.target;
  const index = el.dataset.index;
  items.splice(index, 1);
  localStorage.setItem("items", JSON.stringify(items));
  populateList(items, itemsList, activeFilter);
}
function toggleDone(e) {
  const el = e.target;
  const index = el.dataset.index;
  items[index].done = !items[index].done;
  localStorage.setItem("items", JSON.stringify(items));
  populateList(items, itemsList, activeFilter);
}
function handelActive(e) {
  activeClass.forEach(e => e.classList.remove("active"));
  const el = e.target;
  el.classList.add("active");
}
function handelFilterAll(e) {
  activeFilter = "all";
  localStorage.setItem("filter", "all");
  populateList(items, itemsList, activeFilter);
}
function handelFilterDone(e) {
  activeFilter = "done";
  localStorage.setItem("filter", "done");
  populateList(items, itemsList, activeFilter);
}
function handelFilterDoing(e) {
  activeFilter = "doing";
  localStorage.setItem("filter", "doing");
  populateList(items, itemsList, activeFilter);
}
function addListenerMulti(element, eventNames, listener) {
  var events = eventNames.split(" ");
  for (var i = 0, iLen = events.length; i < iLen; i++) {
    element.addEventListener(events[i], listener, false);
  }
}

populateList(items, itemsList, activeFilter);
addItems.addEventListener("submit", addItem);
// itemsList.addEventListener("click , keyup", handelEvent);
addListenerMulti(itemsList, "click keyup", handelEvent);

filtrDone.addEventListener("click", handelFilterDone);
filtrDoing.addEventListener("click", handelFilterDoing);
// const inputItems = document.querySelectorAll('inputItem')
// inputItems.forEach(e => e.addEventListener("click", handelActive));

filtrAll.addEventListener("click", handelFilterAll);
activeClass.forEach(e => e.addEventListener("click", handelActive));
activeElemnt.classList.add("active");
