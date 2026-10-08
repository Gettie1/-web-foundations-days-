
const loadButton = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const status = document.getElementById("status");
const usersList = document.getElementById("users-list");

const API_URL = "https://jsonplaceholder.typicode.com/users";

let users = [];

// Display any array of users in the list.
function renderUsers(list) {
    usersList.replaceChildren();

    if (list.length === 0) {
        status.textContent = "No users match your filter.";
        return;
    }

    list.forEach((user) => {
        const li = document.createElement("li");

        const name = document.createElement("h2");
        name.textContent = user.name;

        const email = document.createElement("p");
        email.textContent = `Email: ${user.email}`;

        const city = document.createElement("p");
        city.textContent = `City: ${user.address.city}`;

        const company = document.createElement("p");
        company.textContent = `Company: ${user.company.name}`;

        li.append(name, email, city, company);
        usersList.appendChild(li);
    });

    status.textContent = `Showing ${list.length} user(s).`;
}

// Fetch users from the API.
async function loadUsers() {
    loadButton.disabled = true;
    status.textContent = "Loading users...";
    usersList.replaceChildren();

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        users = await response.json();

        // Apply the current filter to the newly loaded users.
        const searchText = filterInput.value.trim().toLowerCase();

        const filteredUsers = users.filter((user) =>
            user.name.toLowerCase().includes(searchText)
        );

        renderUsers(filteredUsers);
    } catch (error) {
        users = [];
        usersList.replaceChildren();
        status.textContent =
            "Error loading users. Please try again.";
        console.error("Failed to load users:", error);
    } finally {
        loadButton.disabled = false;
    }
}

// Load users when the button is clicked.
loadButton.addEventListener("click", loadUsers);

// Filter the stored array without making another API request.
filterInput.addEventListener("input", () => {
    const searchText = filterInput.value.trim().toLowerCase();

    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchText)
    );

    renderUsers(filteredUsers);
});