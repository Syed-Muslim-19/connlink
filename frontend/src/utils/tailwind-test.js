/**
 * Utility functions to test if Tailwind CSS is working properly
 */

/**
 * Check if Tailwind CSS is loaded and working
 * @returns {boolean} true if Tailwind is working, false otherwise
 */
export function isTailwindWorking() {
  // Create a temporary element to test Tailwind classes
  const testElement = document.createElement('div')
  testElement.className = 'bg-blue-500 hidden'
  testElement.style.position = 'absolute'
  testElement.style.top = '-9999px'
  
  document.body.appendChild(testElement)
  
  try {
    const computedStyle = window.getComputedStyle(testElement)
    const backgroundColor = computedStyle.backgroundColor
    const display = computedStyle.display
    
    // Remove test element
    document.body.removeChild(testElement)
    
    // Check if bg-blue-500 is applied (should be blue)
    const hasBlueBackground = backgroundColor === 'rgb(59, 130, 246)' || 
                             backgroundColor.includes('59, 130, 246')
    
    // Check if hidden class is applied (should be display: none)
    const hasHiddenClass = display === 'none'
    
    return hasBlueBackground && hasHiddenClass
  } catch (error) {
    // Clean up in case of error
    if (document.body.contains(testElement)) {
      document.body.removeChild(testElement)
    }
    console.error('Error testing Tailwind CSS:', error)
    return false
  }
}

/**
 * Test multiple Tailwind utilities
 * @returns {Object} Object containing test results for different utilities
 */
export function testTailwindUtilities() {
  const results = {
    colors: false,
    spacing: false,
    typography: false,
    flexbox: false,
    display: false,
    overall: false
  }

  try {
    // Test colors
    const colorTest = document.createElement('div')
    colorTest.className = 'bg-red-500'
    colorTest.style.position = 'absolute'
    colorTest.style.top = '-9999px'
    document.body.appendChild(colorTest)
    
    const redBg = window.getComputedStyle(colorTest).backgroundColor
    results.colors = redBg === 'rgb(239, 68, 68)' || redBg.includes('239, 68, 68')
    document.body.removeChild(colorTest)

    // Test spacing
    const spacingTest = document.createElement('div')
    spacingTest.className = 'p-4'
    spacingTest.style.position = 'absolute'
    spacingTest.style.top = '-9999px'
    document.body.appendChild(spacingTest)
    
    const padding = window.getComputedStyle(spacingTest).padding
    results.spacing = padding === '16px' || padding.includes('16px')
    document.body.removeChild(spacingTest)

    // Test typography
    const typographyTest = document.createElement('div')
    typographyTest.className = 'text-xl font-bold'
    typographyTest.style.position = 'absolute'
    typographyTest.style.top = '-9999px'
    document.body.appendChild(typographyTest)
    
    const fontSize = window.getComputedStyle(typographyTest).fontSize
    const fontWeight = window.getComputedStyle(typographyTest).fontWeight
    results.typography = (fontSize === '20px' || fontSize === '1.25rem') && 
                        (fontWeight === '700' || fontWeight === 'bold')
    document.body.removeChild(typographyTest)

    // Test flexbox
    const flexTest = document.createElement('div')
    flexTest.className = 'flex justify-center items-center'
    flexTest.style.position = 'absolute'
    flexTest.style.top = '-9999px'
    document.body.appendChild(flexTest)
    
    const display = window.getComputedStyle(flexTest).display
    const justifyContent = window.getComputedStyle(flexTest).justifyContent
    const alignItems = window.getComputedStyle(flexTest).alignItems
    results.flexbox = display === 'flex' && justifyContent === 'center' && alignItems === 'center'
    document.body.removeChild(flexTest)

    // Test display utilities
    const displayTest = document.createElement('div')
    displayTest.className = 'block'
    displayTest.style.position = 'absolute'
    displayTest.style.top = '-9999px'
    document.body.appendChild(displayTest)
    
    const blockDisplay = window.getComputedStyle(displayTest).display
    results.display = blockDisplay === 'block'
    document.body.removeChild(displayTest)

    // Overall result
    results.overall = results.colors && results.spacing && results.typography && 
                     results.flexbox && results.display

  } catch (error) {
    console.error('Error testing Tailwind utilities:', error)
  }

  return results
}

/**
 * Run a comprehensive Tailwind test and log results
 */
export function runTailwindDiagnostics() {
  console.log('🎨 Running Tailwind CSS Diagnostics...\n')
  
  const isWorking = isTailwindWorking()
  console.log(`Overall Status: ${isWorking ? '✅ Working' : '❌ Not Working'}\n`)
  
  const utilities = testTailwindUtilities()
  console.log('Utility Tests:')
  console.log(`  Colors: ${utilities.colors ? '✅' : '❌'}`)
  console.log(`  Spacing: ${utilities.spacing ? '✅' : '❌'}`)
  console.log(`  Typography: ${utilities.typography ? '✅' : '❌'}`)
  console.log(`  Flexbox: ${utilities.flexbox ? '✅' : '❌'}`)
  console.log(`  Display: ${utilities.display ? '✅' : '❌'}`)
  console.log(`  Overall: ${utilities.overall ? '✅' : '❌'}\n`)
  
  if (!isWorking || !utilities.overall) {
    console.log('🔧 Troubleshooting Tips:')
    console.log('1. Check if Tailwind CSS is installed: npm list tailwindcss')
    console.log('2. Verify postcss.config.js has @tailwindcss/postcss plugin')
    console.log('3. Ensure @tailwind directives are in your CSS file')
    console.log('4. Check if there are any build errors')
    console.log('5. Try restarting your development server')
  } else {
    console.log('🎉 Tailwind CSS is working perfectly!')
  }
  
  return {
    isWorking,
    utilities
  }
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  window.tailwindTest = {
    isTailwindWorking,
    testTailwindUtilities,
    runTailwindDiagnostics
  }
}
