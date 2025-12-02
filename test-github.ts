#!/usr/bin/env bun
import { githubService } from './src/services/github.ts';

async function testGitHubIntegration() {
  console.log('Testing GitHub integration...\n');
  
  // Test with a known GitHub repository
  const testUrl = 'https://github.com/knoopx/opencode-plugin-command-blocker';
  console.log(`Testing with: ${testUrl}`);
  
  try {
    const repoData = await githubService.getRepository(testUrl);
    
    if (repoData) {
      console.log('✅ Successfully fetched repository data:');
      console.log(`   Name: ${repoData.full_name}`);
      console.log(`   Description: ${repoData.description}`);
      console.log(`   Stars: ${repoData.stargazers_count}`);
      console.log(`   Language: ${repoData.language}`);
      console.log(`   License: ${repoData.license?.name || 'None'}`);
      console.log(`   README length: ${repoData.readme?.length || 0} characters`);
      
      // Test saving details
      const savedPath = await githubService.saveRepoDetails(repoData);
      console.log(`✅ Saved details to: ${savedPath}`);
    } else {
      console.log('❌ Failed to fetch repository data');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  // Test with non-GitHub URL
  console.log('\nTesting with non-GitHub URL...');
  const gistUrl = 'https://gist.github.com/rstacruz/024a1d798c315c7f1c4607c7cf433a4e';
  const gistData = await githubService.getRepository(gistUrl);
  console.log(`Gist handling: ${gistData === null ? '✅ Correctly returned null' : '❌ Should return null'}`);
  
  console.log('\nGitHub integration test completed!');
}

testGitHubIntegration().catch(console.error);