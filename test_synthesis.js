// Test the fixed aiFeedbackSynthesize function
import { aiFeedbackSynthesize } from './src/aiAssessor.js';

const testHistory = [
  {
    role: "assistant",
    text: "Hello, how can I help you today?"
  },
  {
    role: "user",
    text: "Ini butuh Banyak perbaikan Project tidak bisa di delete"
  },
  {
    role: "assistant",
    text: "Your feedback will be recorded and reviewed by our team. Is there anything else?"
  }
];

async function test() {
  console.log('Testing aiFeedbackSynthesize with delete bug feedback...\n');

  const result = await aiFeedbackSynthesize(
    testHistory,
    'demo@hitec.id',
    'starter',
    'ID'
  );

  console.log('=== SYNTHESIS RESULT ===');
  console.log('Title:', result.title);
  console.log('Satisfaction:', result.satisfaction_note);
  console.log('Issues count:', result.issues.length);
  console.log('\nIssues:');
  result.issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`);
    console.log(`   Screen: ${issue.screen}`);
    console.log(`   Quote: "${issue.original_quote}"`);
  });

  console.log('\n=== EXPECTED ===');
  console.log('- Should detect "tidak bisa" = cannot');
  console.log('- Should detect "delete" and set screen to "Delete Project"');
  console.log('- Should have severity="critical"');
  console.log('- Should have title="Cannot delete project"');
  console.log('- Satisfaction should NOT be "High Satisfaction"');
}

test();
