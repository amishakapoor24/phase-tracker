const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Progress = require('./models/Progress');
const SubPhase = require('./models/SubPhase');
const Phase = require('./models/Phase');

const migrate = async () => {
  try {
    console.log('Connecting to DB and starting migration...');
    const allPhases = await Phase.find().sort({ order: 1 });
    if (allPhases.length === 0) {
      console.log('No phases found. Exiting.');
      process.exit(0);
    }

    const startingPhase = allPhases.find(p => p.isStarting) || allPhases[0];
    console.log(`Starting Phase is: ${startingPhase.id}`);

    const startingSubPhases = await SubPhase.find({ phaseId: startingPhase.id }).sort({ order: 1 });
    
    const initializedSubPhases = startingSubPhases.map((sp, index) => ({
      subPhaseId: sp.id,
      status: index === 0 ? 'unlocked' : 'locked',
      approvalRequested: false,
      approvalStatus: null
    }));

    const progresses = await Progress.find();
    let updatedCount = 0;

    for (const prog of progresses) {
      // Overwrite the phases array with fresh phases from the DB
      prog.phases = allPhases.map((phase) => ({
        phaseId: phase.id,
        status: phase.id === startingPhase.id ? 'unlocked' : 'locked',
        subPhases: phase.id === startingPhase.id ? initializedSubPhases : [],
        attempts: [],
        bestScore: 0
      }));

      // Overwrite the currentPhase to the actual starting phase
      prog.currentPhase = startingPhase.id;
      
      await prog.save();
      updatedCount++;
    }

    console.log(`Migration complete. Reset and updated ${updatedCount} progress documents.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
