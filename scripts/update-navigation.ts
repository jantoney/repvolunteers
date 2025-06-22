import { load } from "dotenv";

// Load environment variables
await load({ export: true });

async function updateRemainingPages() {
  console.log("🔧 Updating remaining admin pages with navigation component...");
  
  const pagesToUpdate = [
    "src/views/admin/new-show.ts",
    "src/views/admin/edit-show.ts", 
    "src/views/admin/new-volunteer.ts",
    "src/views/admin/edit-volunteer.ts",
    "src/views/admin/new-shift.ts",
    "src/views/admin/edit-shift.ts",
  ];

  for (const filePath of pagesToUpdate) {
    try {
      console.log(`🔍 Processing ${filePath}...`);
      let content = await Deno.readTextFile(filePath);
      
      // Add navigation import if not present
      if (!content.includes('getAdminNavigation')) {
        content = content.replace(
          /import { getPool } from "\.\.\/\.\.\/models\/db\.ts";/,
          `import { getPool } from "../../models/db.ts";\nimport { getAdminNavigation, getAdminStyles } from "./components/navigation.ts";`
        );
      }
      
      // Replace <style> with navigation styles
      if (content.includes('<style>')) {
        content = content.replace(
          /<style>/,
          '${getAdminStyles()}'
        );
        
        // Remove the closing </style> tag
        content = content.replace(
          /<\/style>/,
          ''
        );
      }
      
      // Add navigation HTML after <body>
      if (content.includes('<body>')) {
        content = content.replace(
          /<body>/,
          `<body>\n        \${getAdminNavigation('${getPageName(filePath)}')}\n        \n        <!-- Main Content -->\n        <div class="main-content">`
        );
        
        // Add closing main-content div before </body>
        content = content.replace(
          /<\/body>/,
          '        </div> <!-- Close main-content -->\n      </body>'
        );
      }
      
      await Deno.writeTextFile(filePath, content);
      console.log(`✅ Updated ${filePath}`);
      
    } catch (error) {
      console.log(`⚠️  Could not process ${filePath}:`, error);
    }
  }
  
  console.log("🎉 Page navigation updates complete!");
}

function getPageName(filePath: string): string {
  if (filePath.includes('new-show')) return 'shows';
  if (filePath.includes('edit-show')) return 'shows';
  if (filePath.includes('new-volunteer')) return 'volunteers';
  if (filePath.includes('edit-volunteer')) return 'volunteers';
  if (filePath.includes('new-shift')) return 'shifts';
  if (filePath.includes('edit-shift')) return 'shifts';
  return '';
}

// Run the script
if (import.meta.main) {
  await updateRemainingPages();
}
