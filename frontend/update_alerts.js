const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/pages/AdminAnnouncements.js',
  'src/pages/AdminHouses.js',
  'src/pages/AdminPhases.js',
  'src/pages/AdminQuestions.js',
  'src/pages/AdminSubPhases.js',
  'src/pages/AdminUsers.js',
  'src/pages/MentorApprovals.js',
  'src/pages/QuizPage.js',
  'src/pages/StudentPhaseDetail.js'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Add import if not present
  if (!content.includes("import toast from 'react-hot-toast';")) {
    content = content.replace(/(import .*?;)/, "$1\nimport toast from 'react-hot-toast';");
  }

  // Replace alert() with toast.error() or toast.success() based on text
  // Success markers: ✅, ✨, successfully
  content = content.replace(/alert\((.*?)\)/g, (match, p1) => {
    if (p1.includes('✅') || p1.includes('✨') || p1.includes('successfully') || p1.includes('submitted')) {
      return `toast.success(${p1})`;
    } else {
      return `toast.error(${p1})`;
    }
  });

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
