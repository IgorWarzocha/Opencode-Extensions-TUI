#!/usr/bin/env bun
import { githubService } from './src/services/github.ts';

async function testGitHubService() {
  console.log('Testing GitHub service...');
  
  const testUrl = 'https://github.com/knoopx/opencode-plugin-command-blocker';
  console.log(`Testing with: ${testUrl}`);
  
  try {
    const data = await githubService.getRepoDetails(testUrl);
    
    if (data) {
      console.log('✅ Successfully fetched repository data:');
      console.log(`   Name: ${data.full_name}`);
      console.log(`   Description: ${data.description}`);
      console.log(`   Stars: ${data.stargazers_count}`);
      console.log(`   README length: ${data.readme?.length || 0} characters`);
      console.log(`   README preview: ${data.readme?.substring(0, 100) || 'No README'}...`);
    } else {
      console.log('❌ Failed to fetch repository data');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testGitHubService().catch(console.error);