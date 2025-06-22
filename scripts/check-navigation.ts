import { load } from "dotenv";

// Load environment variables
await load({ export: true });

async function checkNavigationComponents() {
  console.log("🔍 Checking which admin pages use navigation components...");
  
  const adminPages = [
    "src/views/admin/dashboard.ts",
    "src/views/admin/shows.ts", 
    "src/views/admin/volunteers.ts",
    "src/views/admin/shifts.ts",
    "src/views/admin/unfilled-shifts.ts",
    "src/views/admin/new-show.ts",
    "src/views/admin/edit-show.ts",
    "src/views/admin/new-volunteer.ts",
    "src/views/admin/edit-volunteer.ts",
    "src/views/admin/new-shift.ts",
    "src/views/admin/edit-shift.ts",
  ];

  for (const page of adminPages) {
    try {
      const content = await Deno.readTextFile(page);
      const hasNavigation = content.includes('getAdminNavigation');
      const hasStyles = content.includes('getAdminStyles');
      
      console.log(`${hasNavigation && hasStyles ? '✅' : '❌'} ${page}: ${hasNavigation ? 'Navigation ✓' : 'Navigation ✗'} ${hasStyles ? 'Styles ✓' : 'Styles ✗'}`);
    } catch (error) {
      console.log(`⚠️  Could not read ${page}: ${error.message}`);
    }
  }
}

// Run the script
if (import.meta.main) {
  await checkNavigationComponents();
}
