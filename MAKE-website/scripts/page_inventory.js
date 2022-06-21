setInterval(fetchInventory, 100000);
fetchInventory().then(() => {
    submitSearch();
    document.getElementById("inventory-search-input").addEventListener("keyup", submitSearch);
    document.getElementById("inventory-in-stock").addEventListener("change", submitSearch);
    document.getElementById("room-select").addEventListener("change", submitSearch);
    document.getElementById("tool-material-select").addEventListener("change", submitSearch);
});

const search_options = {
    limit: 1000, // don't return more results than you need!
    allowTypo: true, // if you don't care about allowing typos
    threshold: -10000, // don't return bad results
    keys: ['name', 'specific_name', 'serial_number', 'model_number', 'brand', 'uuid'], // keys to search
    all: true,
}

async function fetchInventory() {
    const response = await fetch(`${API}/inventory`);

    if (response.status == 200) {
        const inventory = await response.json();

        state.inventory = inventory;
    }
}

function submitSearch() {
    const search = document.getElementById("inventory-search-input").value;

    const filters = getInventoryFilters();

    const search_results = searchInventory(search, filters);
    const search_divs = generateInventoryDivs(search_results);

    const results = document.getElementById("inventory-results");

    removeAllChildren(results);
    appendChildren(results, search_divs);
}

function getInventoryFilters() {
    const filters = {
        stock: document.getElementById("inventory-in-stock").checked,
        room: document.getElementById("room-select").value,
        tool_material: document.getElementById("tool-material-select").value,
    }

    return filters;
}

function searchInventory(search, filters = null) {
    const results = fuzzysort.go(search, state.inventory.items, search_options);

    const results_norm = results.sort((a, b) => b.score - a.score);

    if (filters !== null) {
        const results_filtered = results_norm.filter(result => {
            const item = result.obj;

            if (filters.stock && item.quantity == 0) {
                return false;
            }

            if (filters.room && item.location_room !== filters.room) {
                return false;
            }

            if (filters.tool_material && item.is_material !== (filters.tool_material === "M")) {
                return false;
            }

            return true;

        });

        return results_filtered;
    }

    return results_norm;
}

function generateInventoryDivs(results) {
    const divs = [];

    for (let i = 0; i < results.length; i++) {
        divs.push(generateInventoryDiv(results[i], i));
    }

    return divs;
}

function generateInventoryDiv(result, index) {
    let div = document.createElement("div");
    div.classList.add("inventory-result");
    div.id = `inventory-result-${index}`;

    const item = result.obj;

    const main_div = document.createElement("div");
    main_div.classList.add("inventory-result-main");

    const name = document.createElement("div");
    name.classList.add("inventory-result-name");
    name.innerText = item.name;
    main_div.appendChild(name);

    const tool_material = document.createElement("div");
    tool_material.classList.add("inventory-result-tool-material");
    tool_material.classList.add(item.is_material ? "material" : "tool");
    tool_material.innerText = item.is_material ? "Material" : "Tool";
    main_div.appendChild(tool_material);

    const location = document.createElement("div");
    location.classList.add("inventory-result-location");
    location.innerText = `${item.location_room} | ${item.location_area}`;
    main_div.appendChild(location);

    const quantity = document.createElement("div");
    quantity.classList.add("inventory-result-quantity");
    quantity.innerText = "Stock: ";
    if (item.quantity >= 0) {
        quantity.innerText += `${item.quantity}`;
    } else {
        switch (item.quantity) {
            case -1:
                quantity.innerText += "Low";
                break;
            case -2:
                quantity.innerText += "Medium";
                break;
            case -3:
                quantity.innerText += "High";
                break;
        }
    }
    main_div.appendChild(quantity);

    const show_lower_div_button = document.createElement("button");
    show_lower_div_button.classList.add("inventory-result-show-lower-div");
    show_lower_div_button.classList.add("grayed-out");
    show_lower_div_button.innerText = "Details";
    show_lower_div_button.addEventListener("click", () => {
        const lower_div = document.getElementById(`inventory-result-${index}-lower-div`);
        lower_div.classList.toggle("hidden");
    });

    const lower_div = document.createElement("div");
    lower_div.id = `inventory-result-${index}-lower-div`;
    lower_div.classList.add("inventory-result-lower");
    lower_div.classList.add("hidden");

    if (item.serial_number !== "") {
        const serial_number = document.createElement("div");
        serial_number.classList.add("inventory-result-lower-detail");
        serial_number.innerText = `Serial Number: ${item.serial_number}`;
        lower_div.appendChild(serial_number);
    }

    if (item.model_number !== "") {
        const model_number = document.createElement("div");
        model_number.classList.add("inventory-result-lower-detail");
        model_number.innerText = `Model Number: ${item.model_number}`;
        lower_div.appendChild(model_number);
    }

    if (item.specific_name !== "") {
        const specific_name = document.createElement("div");
        specific_name.classList.add("inventory-result-lower-detail");
        specific_name.innerText = `Specific Name: ${item.specific_name}`;
        lower_div.appendChild(specific_name);
    }

    if (item.brand !== "") {
        const brand = document.createElement("div");
        brand.classList.add("inventory-result-lower-detail");
        brand.innerText = `Brand: ${item.brand}`;
        lower_div.appendChild(brand);
    }

    if (item.uuid !== "") {
        const uuid = document.createElement("div");
        uuid.classList.add("inventory-result-lower-detail");
        uuid.innerText = `UUID: ${item.uuid}`;
        lower_div.appendChild(uuid);
    }

    if (lower_div.childNodes.length > 0) {
        show_lower_div_button.classList.remove("grayed-out");
    }

    main_div.appendChild(show_lower_div_button);

    div.appendChild(main_div);
    div.appendChild(lower_div);

    return div;
}   