let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
    return notes.filter(note =>
        note.text.toLowerCase().includes(word.toLowerCase())
    );
}

function longestNote() {
    if (notes.length === 0) {
        return null;
    }

    let longest = notes[0];

    for (let note of notes) {
        if (note.text.length > longest.text.length) {
            longest = note;
        }
    }

    return longest;
}

function countByCategory() {
    let counts = {};

    for (let note of notes) {
        if (counts[note.category] === undefined) {
            counts[note.category] = 0;
        }

        counts[note.category]++;
    }

    return counts;
}

function getSummary() {
    const counts = countByCategory();
    const total = notes.length;

    const noteWord = total === 1 ? "note" : "notes";

    return `${total} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}

function isDuplicate(text) {
    const normalizedText = text.trim().toLowerCase();

    return notes.some(note =>
        note.text.trim().toLowerCase() === normalizedText
    );
}

function addNote(text, category) {
    const trimmedText = text.trim();
    const validCategories = ["personal", "work", "study"];

    if (trimmedText.length < 1 || trimmedText.length > 200) {
        console.log("Note must be between 1 and 200 characters.");
        return false;
    }

    if (isDuplicate(trimmedText)) {
        console.log("Note is a duplicate.");
        return false;
    }

    if (!validCategories.includes(category)) {
        console.log("Invalid category.");
        return false;
    }

    const newId = notes.length > 0
        ? Math.max(...notes.map(note => note.id)) + 1
        : 1;

    notes.push({
        id: newId,
        text: trimmedText,
        category: category
    });

    return true;
}


// Tests

console.log(searchNotes("javascript"));
// Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]

console.log(searchNotes("pizza"));
// Expected: []


console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

console.log("Longest note in empty array:", (() => {
    const savedNotes = notes;
    notes = [];
    const result = longestNote();
    notes = savedNotes;
    return result;
})());
// Expected: null


console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

console.log("Count with empty notes:", (() => {
    const savedNotes = notes;
    notes = [];
    const result = countByCategory();
    notes = savedNotes;
    return result;
})());
// Expected: {}


console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

console.log("Single note summary:", (() => {
    const savedNotes = notes;
    notes = [
        { id: 1, text: "Test note", category: "personal" }
    ];
    const result = getSummary();
    notes = savedNotes;
    return result;
})());
// Expected: "1 note: 1 personal, 0 work, 0 study."


console.log(isDuplicate("  BUY MILK AND BREAD  "));
// Expected: true

console.log(isDuplicate("Buy eggs"));
// Expected: false


console.log(addNote("Learn JavaScript functions", "study"));
// Expected: true

console.log(addNote("  Buy milk and bread  ", "personal"));
// Expected: false, logs "Note is a duplicate."

console.log(addNote("", "study"));
// Expected: false, logs "Note must be between 1 and 200 characters."

console.log(addNote("Some new note", "invalid"));
// Expected: false, logs "Invalid category."