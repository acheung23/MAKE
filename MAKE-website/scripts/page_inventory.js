const search_options = {
    limit: 1000, // don't return more results than you need!
    allowTypo: true, // if you don't care about allowing typos
    threshold: -10000, // don't return bad results
    keys: ['name', 'specific_name', 'serial_number', 'model_number', 'brand', 'uuids_joined', 'kit'], // keys to search
    all: true,
}

async function fetchInventory(kiosk_mode = false) {
    const response = await fetch(`${API}/inventory`);

    if (response.status == 200) {
        const inventory = await response.json();

        state.inventory = inventory;

        inventory.items.forEach((element, index) => {
            element.uuids_joined = element.uuids.join(" ");
            element.index = index;
        });

        if (!kiosk_mode) {
            saveState();
        }
    }
}

function submitSearch(kiosk_mode=false) {
    const search = document.getElementById("inventory-search-input").value;

    const filters = getInventoryFilters();

    const search_results = searchInventory(search, filters);
    const search_divs = generateInventoryDivs(search_results, kiosk_mode);

    const results = document.getElementById("inventory-results");

    removeAllChildren(results);
    appendChildren(results, search_divs);
    if (kiosk_mode === true) {
        updateSelectedItems();
    }
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

function generateInventoryDivs(results, kiosk_mode=false) {
    const divs = [];

    divs.push(generateInventoryHeader(kiosk_mode));

    for (let i = 0; i < results.length; i++) {
        divs.push(generateInventoryDiv(results[i], kiosk_mode));
    }

    return divs;
}

function generateInventoryHeader(kiosk_mode=false) {
    const div = document.createElement("div");
    div.classList.add("inventory-result");
    div.classList.add("header");
    if (kiosk_mode === true) {
        div.classList.add("kiosk-mode");
    }

    const header = document.createElement("div");
    header.classList.add("inventory-result-main");
    header.classList.add("inventory-header");

    if (kiosk_mode === true) {
        header.classList.add("kiosk-mode");
    }

    const name = document.createElement("div");
    name.classList.add("inventory-header-name");
    name.innerHTML = "Name";

    const tool_material = document.createElement("div");
    tool_material.classList.add("inventory-header-tool-material");
    tool_material.innerHTML = "Tool/Material";

    const location = document.createElement("div");
    location.classList.add("inventory-header-location");
    location.innerHTML = "Location";
    
    const quantity = document.createElement("div");
    quantity.classList.add("inventory-header-quantity");
    quantity.innerHTML = "Quantity";

    const more_details = document.createElement("div");
    more_details.classList.add("inventory-header-more-details");
    more_details.innerHTML = "Details";

    header.appendChild(name);
    header.appendChild(tool_material);
    header.appendChild(location);
    header.appendChild(quantity);
    header.appendChild(more_details);

    div.appendChild(header);
    return div;
}

function generateInventoryDiv(result, kiosk_mode=false) {
    let div = document.createElement("div");
    div.classList.add("inventory-result");

    if (kiosk_mode === true) {
        div.classList.add("kiosk-mode");
    }

    const item = result.obj;

    div.id = `inventory-result-${item.index}`;

    
    if (item.is_kit === true) {
        div.classList.add("kit");

        const kit_div = document.createElement("div");
        kit_div.classList.add("kit-div");
        kit_div.innerHTML = "Kit";
        div.appendChild(kit_div);
    }

    const main_div = document.createElement("div");
    main_div.classList.add("inventory-result-main");

    const name = document.createElement("div");
    name.classList.add("inventory-result-name");
    name.innerText = item.name;
    main_div.appendChild(name);

    if (item.is_kit === true) {
        const kit_items = document.createElement("div");
        kit_items.classList.add("kit-items");
        for (let kit_item of item.kit_items) {
            const kit_item_div = document.createElement("div");
            kit_item_div.classList.add("kit-item");
            kit_item_div.innerText = kit_item;
            kit_items.appendChild(kit_item_div);
        }
        main_div.appendChild(kit_items);
    } else {
        const tool_material = document.createElement("div");
        tool_material.classList.add("inventory-result-tool-material");
        tool_material.classList.add(item.is_material ? "material" : "tool");
        tool_material.title = item.is_material ? "Material" : "Tool";
        main_div.appendChild(tool_material);
    }


    const location = document.createElement("div");
    location.classList.add("inventory-result-location");
    location.innerHTML = `<span class="room">${item.location_room}</span> <span class="area">${item.location_area}</span>`;
    main_div.appendChild(location);

    if (item.is_kit === false) {
        const quantity = document.createElement("div");
        quantity.classList.add("inventory-result-quantity");
        if (item.quantity >= 0) {
            quantity.classList.add("number");
            if (item.checked_quantity > 0) {
                quantity.innerText = `${item.quantity - item.checked_quantity}/${item.quantity}`;
            } else {
                quantity.innerText = `${item.quantity}`;
            }
        } else {
            switch (item.quantity) {
                case -1:
                    quantity.classList.add("low");
                    quantity.innerText += "Low";
                    break;
                case -2:
                    quantity.classList.add("medium");
                    quantity.innerText += "Medium";
                    break;
                case -3:
                    quantity.classList.add("high");
                    quantity.innerText += "High";
                    break;
            }
        }
        main_div.appendChild(quantity);
    }

    const lower_div = document.createElement("div");
    lower_div.id = `inventory-result-${item.index}-lower-div`;
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

    if (item.uuids_joined !== "") {
        const uuid = document.createElement("div");
        uuid.classList.add("inventory-result-lower-detail");
        uuid.innerText = `UUID(s): ${item.uuids_joined}`;
        lower_div.appendChild(uuid);
    }

    const show_lower_div_button = document.createElement("button");
    show_lower_div_button.classList.add("inventory-result-show-lower-div");
    show_lower_div_button.classList.add("grayed-out");

    if (lower_div.childNodes.length > 0) {
        show_lower_div_button.classList.remove("grayed-out");
        show_lower_div_button.addEventListener("click", () => {
            const lower_div = document.getElementById(`inventory-result-${item.index}-lower-div`);
            lower_div.classList.toggle("hidden");
            show_lower_div_button.classList.toggle("flipped");
        });
    }

    main_div.appendChild(show_lower_div_button);

    if (kiosk_mode === true) {
        // Add checkout button
        const checkout_button = document.createElement("button");
        checkout_button.classList.add("inventory-result-checkout");
        checkout_button.innerText = "+";
        checkout_button.addEventListener("click", () => {
            addToCart(item.name, item.index);
        });
        main_div.appendChild(checkout_button);
    }

    div.appendChild(main_div);
    div.appendChild(lower_div);

    return div;
}  