const express = require('express');
const { protect } = require('../middleware/auth');
const Question = require('../models/Question');
const router = express.Router();

const QUESTIONS = {
  html: [
    { id:1, question:'What does HTML stand for?', options:['Hyper Text Markup Language','High Text Machine Language','Hyperlinks and Text Markup Language','Home Tool Markup Language'], answer:0 },
    { id:2, question:'Which tag is used for the largest heading?', options:['<h6>','<head>','<h1>','<heading>'], answer:2 },
    { id:3, question:'Which attribute specifies a unique id for an HTML element?', options:['class','name','id','key'], answer:2 },
    { id:4, question:'Which HTML element defines the title of a document?', options:['<meta>','<head>','<title>','<header>'], answer:2 },
    { id:5, question:'What is the correct HTML for creating a hyperlink?', options:['<a href="url">link</a>','<link href="url">link</link>','<a url="url">link</a>','<href>url</href>'], answer:0 },
    { id:6, question:'Which HTML tag is used to define an internal style sheet?', options:['<script>','<style>','<css>','<link>'], answer:1 },
    { id:7, question:'Which HTML attribute is used to define inline styles?', options:['class','font','styles','style'], answer:3 },
    { id:8, question:'What does the <br> tag do?', options:['Creates a bold text','Inserts a line break','Creates a border','Creates a block'], answer:1 },
    { id:9, question:'Which tag is used to create an ordered list?', options:['<ul>','<list>','<ol>','<dl>'], answer:2 },
    { id:10, question:'Which HTML element is used to specify a footer for a document?', options:['<bottom>','<footer>','<section>','<div>'], answer:1 }
  ],
  css: [
    { id:1, question:'What does CSS stand for?', options:['Creative Style Sheets','Cascading Style Sheets','Computer Style Sheets','Colorful Style Sheets'], answer:1 },
    { id:2, question:'Which CSS property controls the text size?', options:['text-style','font-size','text-size','font-style'], answer:1 },
    { id:3, question:'Which property is used to change the background color?', options:['color','bgcolor','background-color','background'], answer:2 },
    { id:4, question:'How do you make text bold in CSS?', options:['font-weight: bold','text-weight: bold','font-style: bold','text-style: bold'], answer:0 },
    { id:5, question:'Which property sets the space between elements?', options:['padding','spacing','margin','border'], answer:2 },
    { id:6, question:'What is the default value of the position property?', options:['relative','fixed','absolute','static'], answer:3 },
    { id:7, question:'Which display value makes elements sit side by side?', options:['block','inline-block','flex','both b and c'], answer:3 },
    { id:8, question:'Which CSS property is used to make a flex container?', options:['display: flex','flex: 1','flexbox: true','layout: flex'], answer:0 },
    { id:9, question:'What does z-index control?', options:['Zoom level','Horizontal position','Stack order','Width'], answer:2 },
    { id:10, question:'Which selector targets an element with id="nav"?', options:['.nav',':nav','#nav','*nav'], answer:2 }
  ],
  javascript: [
    { id:1, question:'Which keyword declares a variable that cannot be reassigned?', options:['var','let','const','static'], answer:2 },
    { id:2, question:'What is the output of typeof null?', options:['null','undefined','object','string'], answer:2 },
    { id:3, question:'Which method adds an element to the end of an array?', options:['push()','pop()','shift()','append()'], answer:0 },
    { id:4, question:'What does === check?', options:['Value only','Type only','Value and type','Neither'], answer:2 },
    { id:5, question:'Which is NOT a JavaScript data type?', options:['Boolean','Integer','String','Symbol'], answer:1 },
    { id:6, question:'What does JSON stand for?', options:['JavaScript Object Notation','JavaScript Online Notation','Java Simple Object Notation','JavaScript Ordered Names'], answer:0 },
    { id:7, question:'How do you create an arrow function?', options:['function() =>','() -> {}','() => {}','=> function()'], answer:2 },
    { id:8, question:'Which method converts a JSON string to an object?', options:['JSON.parse()','JSON.stringify()','JSON.convert()','JSON.toObject()'], answer:0 },
    { id:9, question:'What does async/await help with?', options:['Loops','Synchronous code','Handling promises','Error handling only'], answer:2 },
    { id:10, question:'Which array method creates a new array with filtered elements?', options:['map()','reduce()','filter()','find()'], answer:2 }
  ],
  dom: [
    { id:1, question:'What does DOM stand for?', options:['Document Object Model','Data Object Model','Document Oriented Module','Dynamic Object Model'], answer:0 },
    { id:2, question:'Which method selects an element by its id?', options:['querySelector()','getElement()','getElementById()','selectById()'], answer:2 },
    { id:3, question:'How do you add a CSS class to an element?', options:['element.addStyle()','element.setClass()','element.classList.add()','element.class.push()'], answer:2 },
    { id:4, question:'Which event fires when a button is clicked?', options:['onhover','onclick','onchange','onfocus'], answer:1 },
    { id:5, question:'How do you change the inner text of an element?', options:['element.text','element.innerHTML only','element.innerText','element.content'], answer:2 },
    { id:6, question:'Which method creates a new HTML element?', options:['document.create()','document.createElement()','document.newElement()','document.makeElement()'], answer:1 },
    { id:7, question:'How do you append a child element?', options:['parent.append()','parent.addChild()','parent.appendChild()','parent.insert()'], answer:2 },
    { id:8, question:'Which method removes an element?', options:['element.delete()','element.remove()','element.destroy()','element.clear()'], answer:1 },
    { id:9, question:'What does event.preventDefault() do?', options:['Stops bubbling','Prevents default browser behavior','Removes event listener','Pauses the event'], answer:1 },
    { id:10, question:'Which property gives the value of an input element?', options:['element.text','element.content','element.data','element.value'], answer:3 }
  ],
  react: [
    { id:1, question:'What is JSX?', options:['A database query language','A JavaScript XML syntax extension','A CSS framework','A testing library'], answer:1 },
    { id:2, question:'Which hook manages state in a functional component?', options:['useEffect','useContext','useState','useReducer'], answer:2 },
    { id:3, question:'What does useEffect run after?', options:['Every render by default','Only on mount','Only on unmount','Only on state change'], answer:0 },
    { id:4, question:'How do you pass data to a child component?', options:['State','Context','Props','Refs'], answer:2 },
    { id:5, question:'What is the virtual DOM?', options:['A server-side DOM','A lightweight copy of the real DOM','A CSS layout tool','A database'], answer:1 },
    { id:6, question:'Which method lifts state up in React?', options:['Passing callbacks as props','Using localStorage','Redux only','Context only'], answer:0 },
    { id:7, question:'What is a React key used for?', options:['Styling elements','Uniquely identifying list items','Authentication','Database keys'], answer:1 },
    { id:8, question:'What does the spread operator do in JSX props?', options:['Creates a copy of state','Spreads all object properties as props','Merges two components','Imports a module'], answer:1 },
    { id:9, question:'Which hook fetches data on component mount?', options:['useState','useRef','useEffect','useMemo'], answer:2 },
    { id:10, question:'What is React.Fragment used for?', options:['Styling','Grouping elements without extra DOM nodes','State management','Routing'], answer:1 }
  ],
  backend: [
    { id:1, question:'What does REST stand for?', options:['Representational State Transfer','Remote Execution Standard Transfer','Responsive State Technology','Real-time Event Stream Transfer'], answer:0 },
    { id:2, question:'Which HTTP method is used to create a resource?', options:['GET','PUT','POST','DELETE'], answer:2 },
    { id:3, question:'What is middleware in Express?', options:['A database tool','Functions that execute between request and response','A frontend library','A caching layer'], answer:1 },
    { id:4, question:'What does MongoDB store data as?', options:['Tables','XML documents','JSON-like documents','CSV files'], answer:2 },
    { id:5, question:'Which status code means "not found"?', options:['200','401','404','500'], answer:2 },
    { id:6, question:'What does JWT stand for?', options:['JSON Web Token','Java Web Transfer','JavaScript Web Tool','JSON Workflow Type'], answer:0 },
    { id:7, question:'What is the purpose of bcrypt?', options:['Database indexing','Hashing passwords securely','Caching API responses','Routing requests'], answer:1 },
    { id:8, question:'Which command initializes a Node.js project?', options:['node init','npm start','npm init','node setup'], answer:2 },
    { id:9, question:'What does app.use() do in Express?', options:['Creates a database','Mounts middleware or routes','Starts the server','Connects to MongoDB'], answer:1 },
    { id:10, question:'Which Mongoose method finds all documents in a collection?', options:['Model.get()','Model.all()','Model.fetch()','Model.find()'], answer:3 }
  ]
};

router.get('/:phaseId', protect, async (req, res) => {
  try {
    const dbQuestions = await Question.find({ phaseId: req.params.phaseId }).select('-answer');
    if (dbQuestions.length > 0) {
      // Map _id to id so frontend can use it consistently
      const mapped = dbQuestions.map(q => {
        const obj = q.toObject();
        obj.id = obj._id;
        return obj;
      });
      return res.json(mapped);
    }
    const questions = QUESTIONS[req.params.phaseId];
    if (!questions) return res.status(404).json({ message: 'Quiz not found' });
    const sanitized = questions.map(({ answer, ...q }) => q);
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:phaseId/validate', protect, async (req, res) => {
  try {
    const { answers } = req.body;
    let questions = await Question.find({ phaseId: req.params.phaseId });
    
    if (questions.length === 0) {
      questions = QUESTIONS[req.params.phaseId];
      if (!questions) return res.status(404).json({ message: 'Quiz not found' });
    }

    let score = 0;
    const results = questions.map((q, i) => {
      const correct = q.answer === answers[i];
      if (correct) score++;
      return { questionId: q.id || q._id, correct, correctAnswer: q.answer, yourAnswer: answers[i] };
    });
    res.json({ score, total: questions.length, percentage: Math.round((score / questions.length) * 100), results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
