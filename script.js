// loadFileData ফাংশন
var gk_isXlsx = false;
var gk_xlsxFileLookup = {};
var gk_fileData = {};

function filledCell(cell) {
  return cell !== '' && cell != null;
}

function loadFileData(filename) {
  if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
    try {
      var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
      var firstSheetName = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[firstSheetName];
      var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
      var filteredData = jsonData.filter(row => row.some(filledCell));
      var headerRowIndex = filteredData.findIndex((row, index) =>
        row.filter(filledCell).length >= filteredData[index + 1]?.filter(filledCell).length
      );
      if (headerRowIndex === -1 || headerRowIndex > 25) {
        headerRowIndex = 0;
      }
      var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex));
      csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
      return csv;
    } catch (e) {
      console.error(e);
      return "";
    }
  }
  return gk_fileData[filename] || "";
}

// Tailwind কনফিগারেশন
tailwind.config = {
  theme: {
    extend: {
      colors: {
        'pantone-1274c': '#F3E4A7',
        'pantone-186c': '#C8102E'
      }
    }
  }
};

// প্রধান লজিক
document.addEventListener('DOMContentLoaded', () => {
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
  } else {
    console.error('pdf.js failed to load. Manual input will be used.');
  }

  const pantoneColorMap = {
    'P127-4C': 'pantone-1274c',
    '186 C': 'pantone-186c',
    'default': 'gray-500'
  };

  window.toggleCustomAnilox = function(color) {
    const select = document.getElementById(`anilox${color}`);
    const customDiv = document.getElementById(`customAnilox${color}`);
    if (select && customDiv) {
      customDiv.classList.toggle('hidden', select.value !== 'custom');
      if (select.value === 'custom') {
        const customBCM = document.getElementById(`customAnilox${color}BCM`);
        if (customBCM && !customBCM.value) customBCM.value = '2.0';
      }
    } else {
      console.error(`Element not found: anilox${color} or customAnilox${color}`);
    }
  };

  function toggleCustomMaterial() {
    const select = document.getElementById('materialType');
    const customDiv = document.getElementById('customMaterial');
    if (select && customDiv) {
      customDiv.classList.toggle('hidden', select.value !== 'custom');
    }
  }

  window.addCustomMaterial = function() {
    const nameInput = document.getElementById('customMaterialName');
    const factorInput = document.getElementById('customMaterialFactor');
    const name = nameInput.value.trim();
    const factor = parseFloat(factorInput.value);

    if (!name || isNaN(factor) || factor <= 0) {
      alert('Please enter a valid material name and factor (greater than 0).');
      return;
    }

    const select = document.getElementById('materialType');
    const existingOption = Array.from(select.options).find(option => option.value === name);
    if (existingOption) {
      alert('Material name already exists. Please choose a different name.');
      return;
    }

    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.insertBefore(option, select.querySelector('option[value="custom"]'));
    select.value = name;

    window.materialFactors = window.materialFactors || {};
    window.materialFactors[name] = factor;

    toggleCustomMaterial();
    nameInput.value = '';
    factorInput.value = '1.0';
  };

  function updateInkCosts() {
    const inkType = document.getElementById('inkType').value;
    const cost = inkType === 'Water Base' ? 350.00 : 850.00;
    const uvCost = inkType === 'Water Base' ? 300.00 : 1000.00;

    document.getElementById('costCyan').value = cost.toFixed(2);
    document.getElementById('costMagenta').value = cost.toFixed(2);
    document.getElementById('costYellow').value = cost.toFixed(2);
    document.getElementById('costBlack').value = cost.toFixed(2);
    document.getElementById('costUVVarnish').value = uvCost.toFixed(2);

    const pantoneCostInputs = document.querySelectorAll('#pantoneCostInputs input[id^="costPantone_"]');
    pantoneCostInputs.forEach(input => {
      input.value = cost.toFixed(2);
    });
  }

  function selectAniloxValue(percentage) {
    if (percentage > 30) return '2.7'; // High coverage, use lower BCM
    if (percentage >= 10) return '4.1'; // Medium coverage
    return '5.0'; // Low coverage, default
  }

  window.addPantoneInput = function(code = '', percentage = '') {
    const pantoneInputs = document.getElementById('pantoneInputs');
    const id = `inputColorPantone_${code.replace(/\s+/g, '_') || Date.now()}`;
    const aniloxValue = percentage ? selectAniloxValue(parseFloat(percentage)) : '5.0';
    const div = document.createElement('div');
    div.innerHTML = `
      <label class="block text-gray-700">Pantone ${code || 'Custom'}</label>
      <div class="flex gap-2">
        <input id="${id}" type="number" step="0.01" class="w-1/2 px-3 py-2 border rounded-lg" placeholder="Pantone % (e.g., 22.1)" value="${percentage}">
        <select id="anilox${id}" class="w-1/2 px-3 py-2 border rounded-lg" onchange="toggleCustomAnilox('${id}')">
          <option value="5.9" ${aniloxValue === '5.9' ? 'selected' : ''}>250 (5.9)</option>
          <option value="5.6" ${aniloxValue === '5.6' ? 'selected' : ''}>300 (5.6)</option>
          <option value="5.0" ${aniloxValue === '5.0' ? 'selected' : ''}>400 (5.0)</option>
          <option value="4.4" ${aniloxValue === '4.4' ? 'selected' : ''}>450 (4.4)</option>
          <option value="4.4" ${aniloxValue === '4.4' ? 'selected' : ''}>500 (4.4)</option>
          <option value="4.1" ${aniloxValue === '4.1' ? 'selected' : ''}>540 (4.1)</option>
          <option value="4.1" ${aniloxValue === '4.1' ? 'selected' : ''}>550 (4.1)</option>
          <option value="3.8" ${aniloxValue === '3.8' ? 'selected' : ''}>600 (3.8)</option>
          <option value="3.5" ${aniloxValue === '3.5' ? 'selected' : ''}>650 (3.5)</option>
          <option value="3.2" ${aniloxValue === '3.2' ? 'selected' : ''}>700 (3.2)</option>
          <option value="2.9" ${aniloxValue === '2.9' ? 'selected' : ''}>750 (2.9)</option>
          <option value="2.7" ${aniloxValue === '2.7' ? 'selected' : ''}>800 (2.7)</option>
          <option value="2.0" ${aniloxValue === '2.0' ? 'selected' : ''}>850 (2.0)</option>
          <option value="2.0" ${aniloxValue === '2.0' ? 'selected' : ''}>900 (2.0)</option>
          <option value="2.0" ${aniloxValue === '2.0' ? 'selected' : ''}>1000 (2.0)</option>
          <option value="2.0" ${aniloxValue === '2.0' ? 'selected' : ''}>1100 (2.0)</option>
          <option value="custom">Custom...</option>
        </select>
      </div>
      <div id="customAnilox${id}" class="hidden mt-2 flex gap-2">
        <input id="customAnilox${id}LPI" type="number" step="1" class="w-1/2 px-3 py-2 border rounded-lg" placeholder="LPI (e.g., 1200)">
        <input id="customAnilox${id}BCM" type="number" step="0.1" class="w-1/2 px-3 py-2 border rounded-lg" placeholder="BCM (e.g., 1.8)">
      </div>
    `;
    pantoneInputs.appendChild(div);

    const pantoneCostInputs = document.getElementById('pantoneCostInputs');
    const costId = `costPantone_${code.replace(/\s+/g, '_') || Date.now()}`;
    const costValue = document.getElementById('inkType').value === 'Water Base' ? 350.00 : 850.00;
    const costDiv = document.createElement('div');
    costDiv.innerHTML = `
      <label class="block text-gray-700">Cost for Pantone ${code || 'Custom'}</label>
      <input id="${costId}" type="number" step="0.01" value="${costValue.toFixed(2)}" class="w-full px-3 py-2 border rounded-lg" placeholder="Cost for Pantone">
    `;
    pantoneCostInputs.appendChild(costDiv);
  };

  document.getElementById('pdfUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (typeof pdfjsLib === 'undefined') {
      alert('PDF parsing library failed to load. Please use manual inputs.');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

      let extractedData = {
        numJobs: 1,
        jobSize: 0,
        colors: {
          CMYK: { C: 0, M: 0, Y: 0, K: 0 },
          Pantone: {}
        }
      };

      const page1 = await pdf.getPage(1);
      const textContent1 = await page1.getTextContent();
      const page1Text = textContent1.items.map(item => item.str).join(' ');
      console.log('Page 1 Text:', page1Text);

      let widthMm, heightMm;
      const trimBoxMatch = page1Text.match(/(?:Trim box\s*\(T\)|Trim box\s*).*?(\d+\.?\d*)\s*[×xX]\s*(\d+\.?\d*)\s*mm/);
      if (trimBoxMatch) {
        widthMm = parseFloat(trimBoxMatch[1]);
        heightMm = parseFloat(trimBoxMatch[2]);
        extractedData.jobSize = (widthMm * heightMm) / 1_000_000;
      } else {
        const mediaBoxMatch = page1Text.match(/(?:Media box\s*\(M\)|Media box\s*).*?(\d+\.?\d*)\s*[×xX]\s*(\d+\.?\d*)\s*mm/);
        if (mediaBoxMatch) {
          widthMm = parseFloat(mediaBoxMatch[1]);
          heightMm = parseFloat(mediaBoxMatch[2]);
          extractedData.jobSize = (widthMm * heightMm) / 1_000_000;
          console.log('Fallback: Using Media box size');
        } else {
          console.error('No page box size found in Page 1 text');
          alert('Could not extract Job Size from PDF. Please enter Job Size manually.');
        }
      }

      const page2 = await pdf.getPage(2);
      const textContent2 = await page2.getTextContent();
      const page2Text = textContent2.items.map(item => item.str).join(' ');
      console.log('Page 2 Text:', page2Text);

      const cyanMatch = page2Text.match(/Cyan\s*(\d+\.?\d*)\s*%/);
      const magentaMatch = page2Text.match(/Magenta\s*(\d+\.?\d*)\s*%/);
      const yellowMatch = page2Text.match(/Yellow\s*(\d+\.?\d*)\s*%/);
      const blackMatch = page2Text.match(/Black\s*(\d+\.?\d*)\s*%/);

      if (cyanMatch) extractedData.colors.CMYK.C = parseFloat(cyanMatch[1]);
      if (magentaMatch) extractedData.colors.CMYK.M = parseFloat(magentaMatch[1]);
      if (yellowMatch) extractedData.colors.CMYK.Y = parseFloat(yellowMatch[1]);
      if (blackMatch) extractedData.colors.CMYK.K = parseFloat(blackMatch[1]);

      const pantoneRegex = /PANTONE\s*([^\s][^\n]*?)\s*(\d+\.?\d*)\s*%/g;
      let pantoneMatch;
      while ((pantoneMatch = pantoneRegex.exec(page2Text)) !== null) {
        const code = pantoneMatch[1].trim();
        const percentage = parseFloat(pantoneMatch[2]);
        extractedData.colors.Pantone[code] = percentage;
      }

      document.getElementById('numJobs').textContent = extractedData.numJobs;
      document.getElementById('jobSize').textContent = extractedData.jobSize.toFixed(4);
      document.getElementById('colorCyan').textContent = extractedData.colors.CMYK.C.toFixed(2);
      document.getElementById('colorMagenta').textContent = extractedData.colors.CMYK.M.toFixed(2);
      document.getElementById('colorYellow').textContent = extractedData.colors.CMYK.Y.toFixed(2);
      document.getElementById('colorBlack').textContent = extractedData.colors.CMYK.K.toFixed(2);

      const colorPercentages = document.getElementById('colorPercentages');
      const pantoneRows = Object.entries(extractedData.colors.Pantone).map(([code, percentage]) => {
        const colorClass = pantoneColorMap[code] || pantoneColorMap['default'];
        return `
          <div class="flex items-center">
            <span class="w-3 h-3 bg-${colorClass} rounded-full mr-2"></span>
            <p>Pantone ${code}: <span class="font-medium">${percentage.toFixed(2)}</span>%</p>
          </div>
        `;
      }).join('');
      colorPercentages.innerHTML = `
        <div class="flex items-center">
          <span class="w-3 h-3 bg-cyan-500 rounded-full mr-2"></span>
          <p>Cyan: <span id="colorCyan">${extractedData.colors.CMYK.C.toFixed(2)}</span>%</p>
        </div>
        <div class="flex items-center">
          <span class="w-3 h-3 bg-fuchsia-500 rounded-full mr-2"></span>
          <p>Magenta: <span id="colorMagenta">${extractedData.colors.CMYK.M.toFixed(2)}</span>%</p>
        </div>
        <div class="flex items-center">
          <span class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
          <p>Yellow: <span id="colorYellow">${extractedData.colors.CMYK.Y.toFixed(2)}</span>%</p>
        </div>
        <div class="flex items-center">
          <span class="w-3 h-3 bg-black rounded-full mr-2"></span>
          <p>Black: <span id="colorBlack">${extractedData.colors.CMYK.K.toFixed(2)}</span>%</p>
        </div>
        ${pantoneRows}
      `;

      document.getElementById('manualJobSize').value = extractedData.jobSize.toFixed(4);
      document.getElementById('inputColorCyan').value = extractedData.colors.CMYK.C.toFixed(2);
      document.getElementById('inputColorMagenta').value = extractedData.colors.CMYK.M.toFixed(2);
      document.getElementById('inputColorYellow').value = extractedData.colors.CMYK.Y.toFixed(2);
      document.getElementById('inputColorBlack').value = extractedData.colors.CMYK.K.toFixed(2);

      document.getElementById('aniloxCyan').value = selectAniloxValue(extractedData.colors.CMYK.C);
      document.getElementById('aniloxMagenta').value = selectAniloxValue(extractedData.colors.CMYK.M);
      document.getElementById('aniloxYellow').value = selectAniloxValue(extractedData.colors.CMYK.Y);
      document.getElementById('aniloxBlack').value = selectAniloxValue(extractedData.colors.CMYK.K);

      document.getElementById('pantoneInputs').innerHTML = '';
      document.getElementById('pantoneCostInputs').innerHTML = '';
      Object.entries(extractedData.colors.Pantone).forEach(([code, percentage]) => {
        addPantoneInput(code, percentage.toFixed(2));
      });

      document.getElementById('pdfData').classList.remove('hidden');
    } catch (error) {
      alert('Error parsing PDF: ' + error.message + '. Please use manual inputs.');
    }
  });

  function calculateInk() {
    const materialType = document.getElementById('materialType').value;
    const printQuantity = parseFloat(document.getElementById('printQuantity').value) || 1;
    const jobSize = parseFloat(document.getElementById('manualJobSize').value);
    const inkType = document.getElementById('inkType').value;
    const costCyan = parseFloat(document.getElementById('costCyan').value);
    const costMagenta = parseFloat(document.getElementById('costMagenta').value);
    const costYellow = parseFloat(document.getElementById('costYellow').value);
    const costBlack = parseFloat(document.getElementById('costBlack').value);

    const colors = {
      Cyan: {
        percentage: parseFloat(document.getElementById('inputColorCyan').value) / 100,
        aniloxBCM: getAniloxBCM('Cyan')
      },
      Magenta: {
        percentage: parseFloat(document.getElementById('inputColorMagenta').value) / 100,
        aniloxBCM: getAniloxBCM('Magenta')
      },
      Yellow: {
        percentage: parseFloat(document.getElementById('inputColorYellow').value) / 100,
        aniloxBCM: getAniloxBCM('Yellow')
      },
      Black: {
        percentage: parseFloat(document.getElementById('inputColorBlack').value) / 100,
        aniloxBCM: getAniloxBCM('Black')
      }
    };

    const pantoneInputs = document.querySelectorAll('#pantoneInputs input[id^="inputColorPantone_"]');
    const pantoneColors = {};
    const pantoneCosts = {};
    pantoneInputs.forEach(input => {
      const id = input.id;
      const code = id.replace('inputColorPantone_', '').replace(/_/g, ' ');
      pantoneColors[code] = {
        percentage: parseFloat(input.value) / 100,
        aniloxBCM: getAniloxBCM(id)
      };
      const costInput = document.getElementById(`costPantone_${id.replace('inputColorPantone_', '')}`);
      pantoneCosts[code] = costInput ? parseFloat(costInput.value) : 0;
    });

    const defaultMaterialFactors = {
      'Polypropylene': 1.0,
      'Maplitho': 1.0,
      'Chromo': 1.0,
      'Clear To Clear Film': 0.9,
      'Metallic Paper': 1.1,
      'Foil': 1.1
    };
    const materialFactors = { ...defaultMaterialFactors, ...window.materialFactors };
    const materialFactor = materialType === 'custom' ? parseFloat(document.getElementById('customMaterialFactor').value) || 1.0 : materialFactors[materialType] || 1.0;

    let validationErrors = [];
    if (!jobSize || jobSize <= 0) validationErrors.push('Job Size must be greater than 0.');
    if (!printQuantity || printQuantity <= 0) validationErrors.push('Print Quantity must be greater than 0.');
    if (printQuantity === 1) console.warn('Print Quantity is 1. Is this intentional? Typical values are higher (e.g., 1000).');
    if (Object.values(colors).some(c => isNaN(c.percentage))) validationErrors.push('All CMYK color percentages must be valid numbers.');
    if (Object.values(colors).every(c => c.percentage === 0) && Object.keys(pantoneColors).length === 0) validationErrors.push('Please provide at least one non-zero color percentage (CMYK or Pantone).');
    if (!costCyan || !costMagenta || !costYellow || !costBlack) validationErrors.push('Cost per kg for all CMYK colors must be provided.');
    if (Object.values(pantoneColors).some(c => isNaN(c.percentage))) validationErrors.push('All Pantone color percentages must be valid numbers.');
    if (Object.values(pantoneCosts).some(val => isNaN(val) || val <= 0)) validationErrors.push('Cost per kg for all Pantone colors must be provided and greater than 0.');

    const rollPaperWidthMm = parseFloat(document.getElementById('rollPaperWidth').value) || 250;
    const ups = parseFloat(document.getElementById('ups').value) || 1;
    const extraPieces = parseFloat(document.getElementById('extraPieces').value) || 0;
    const bleedArea = parseFloat(document.getElementById('bleedArea').value) || 5;
    const aniloxUV = parseFloat(document.getElementById('aniloxUV').value) || 5.0;
    const costUVVarnish = parseFloat(document.getElementById('costUVVarnish').value) || 1000;

    if (!rollPaperWidthMm || rollPaperWidthMm <= 0) validationErrors.push('Roll Paper Width must be greater than 0.');
    if (!ups || ups <= 0) validationErrors.push('UPs must be greater than 0.');
    if (ups === 1) console.warn('UPs is 1. Is this intentional? Typical values may be higher (e.g., 2).');
    if (bleedArea < 0) validationErrors.push('Bleed Area must be non-negative.');
    if (!costUVVarnish || costUVVarnish <= 0) validationErrors.push('Cost per kg for UV Varnish must be provided and greater than 0.');

    if (validationErrors.length > 0) {
      alert('Validation Errors:\n- ' + validationErrors.join('\n- '));
      return;
    }

    const inkTransferEfficiency = 0.5;
    const cycles = printQuantity / ups;
    const totalArea = jobSize * printQuantity;

    const inks = {};
    Object.entries(colors).forEach(([color, data]) => {
      const inkPerSqM = data.aniloxBCM * 0.001 * inkTransferEfficiency;
      inks[color] = totalArea * inkPerSqM * data.percentage * materialFactor;
    });

    const pantoneInks = {};
    Object.entries(pantoneColors).forEach(([code, data]) => {
      const inkPerSqM = data.aniloxBCM * 0.001 * inkTransferEfficiency;
      pantoneInks[code] = totalArea * inkPerSqM * data.percentage * materialFactor;
    });

    const costs = {
      Cyan: inks.Cyan * costCyan,
      Magenta: inks.Magenta * costMagenta,
      Yellow: inks.Yellow * costYellow,
      Black: inks.Black * costBlack
    };

    const pantoneCostValues = {};
    Object.entries(pantoneInks).forEach(([code, ink]) => {
      pantoneCostValues[code] = ink * pantoneCosts[code];
    });

    const totalInk = Object.values(inks).reduce((sum, val) => sum + (val || 0), 0) +
                     Object.values(pantoneInks).reduce((sum, val) => sum + (val || 0), 0);
    const totalCost = Object.values(costs).reduce((sum, val) => sum + (val || 0), 0) +
                      Object.values(pantoneCostValues).reduce((sum, val) => sum + (val || 0), 0);

    const rollPaperWidth = rollPaperWidthMm / 1000;
    const singleJobLength = jobSize / rollPaperWidth;
    const totalRollLength = singleJobLength * cycles;
    const totalQuantityPrinted = printQuantity;
    const totalQuantityWithExtra = printQuantity + extraPieces;

    const printingWidthMm = (rollPaperWidthMm / ups);
    const uvWidthMm = printingWidthMm + (2 * bleedArea);
    const uvWidthM = uvWidthMm / 1000;
    const uvSingleJobLength = jobSize / uvWidthM;
    const uvTotalArea = uvSingleJobLength * cycles;
    const uvUsagePerSqM = aniloxUV * 0.001 * inkTransferEfficiency;
    const uvUsage = uvTotalArea * uvUsagePerSqM;
    const uvCost = uvUsage * costUVVarnish;

    document.getElementById('inkCyan').textContent = inks.Cyan.toFixed(4);
    document.getElementById('inkMagenta').textContent = inks.Magenta.toFixed(4);
    document.getElementById('inkYellow').textContent = inks.Yellow.toFixed(4);
    document.getElementById('inkBlack').textContent = inks.Black.toFixed(4);

    document.getElementById('costCyanOutput').textContent = costs.Cyan.toFixed(2);
    document.getElementById('costMagentaOutput').textContent = costs.Magenta.toFixed(2);
    document.getElementById('costYellowOutput').textContent = costs.Yellow.toFixed(2);
    document.getElementById('costBlackOutput').textContent = costs.Black.toFixed(2);

    const pantoneResults = document.getElementById('pantoneResults');
    pantoneResults.innerHTML = Object.entries(pantoneInks).map(([code, ink]) => {
      return `
        <div class="flex justify-between">
          <span><strong>Pantone ${code} Ink:</strong> ${ink.toFixed(4)} kg</span>
          <span>Cost: ₹${pantoneCostValues[code].toFixed(2)}</span>
        </div>
      `;
    }).join('');

    document.getElementById('totalArea').textContent = totalArea.toFixed(2);
    document.getElementById('totalInk').textContent = totalInk.toFixed(4);
    document.getElementById('totalCost').textContent = totalCost.toFixed(2);
    document.getElementById('inkTypeUsed').textContent = inkType;

    document.getElementById('rollPaperWidthOutput').textContent = rollPaperWidth.toFixed(3);
    document.getElementById('singleJobLength').textContent = singleJobLength.toFixed(4);
    document.getElementById('totalRollLength').textContent = totalRollLength.toFixed(2);
    document.getElementById('totalQuantityPrinted').textContent = totalQuantityPrinted.toFixed(0);
    document.getElementById('totalQuantityWithExtra').textContent = totalQuantityWithExtra.toFixed(0);

    document.getElementById('uvWidth').textContent = uvWidthMm.toFixed(1);
    document.getElementById('uvSingleJobLength').textContent = uvSingleJobLength.toFixed(4);
    document.getElementById('uvTotalArea').textContent = uvTotalArea.toFixed(2);
    document.getElementById('uvUsage').textContent = uvUsage.toFixed(4);
    document.getElementById('uvCost').textContent = uvCost.toFixed(2);

    // Populate printable report
    const fileInput = document.getElementById('pdfUpload');
    const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : 'Not Uploaded';
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = new Date().toLocaleTimeString('en-US');

    document.getElementById('fileNamePrint').textContent = fileName;
    document.getElementById('datePrint').textContent = currentDate;
    document.getElementById('timePrint').textContent = currentTime;
    document.getElementById('materialTypePrint').textContent = materialType;
    document.getElementById('inkTypePrint').textContent = inkType;
    document.getElementById('jobSizePrint').textContent = jobSize.toFixed(4);
    document.getElementById('printQuantityPrint').textContent = printQuantity.toFixed(0);

    document.getElementById('rollPaperWidthPrint').textContent = rollPaperWidth.toFixed(3);
    document.getElementById('singleJobLengthPrint').textContent = singleJobLength.toFixed(4);
    document.getElementById('totalRollLengthPrint').textContent = totalRollLength.toFixed(2);
    document.getElementById('totalQuantityPrintedPrint').textContent = totalQuantityPrinted.toFixed(0);
    document.getElementById('totalQuantityWithExtraPrint').textContent = totalQuantityWithExtra.toFixed(0);

    document.getElementById('inkCyanPrint').textContent = inks.Cyan.toFixed(4);
    document.getElementById('inkMagentaPrint').textContent = inks.Magenta.toFixed(4);
    document.getElementById('inkYellowPrint').textContent = inks.Yellow.toFixed(4);
    document.getElementById('inkBlackPrint').textContent = inks.Black.toFixed(4);
    document.getElementById('costCyanPrint').textContent = costs.Cyan.toFixed(2);
    document.getElementById('costMagentaPrint').textContent = costs.Magenta.toFixed(2);
    document.getElementById('costYellowPrint').textContent = costs.Yellow.toFixed(2);
    document.getElementById('costBlackPrint').textContent = costs.Black.toFixed(2);

    const pantonePrintLabel = document.getElementById('pantonePrintLabel');
    const pantonePrintValue = document.getElementById('pantonePrintValue');
    const pantoneExtraPrint = document.getElementById('pantoneExtraPrint');
    const pantoneEntries = Object.entries(pantoneInks);

    if (pantoneEntries.length > 0) {
      const [code, ink] = pantoneEntries[0];
      pantonePrintLabel.innerHTML = `Pantone ${code} Ink / Cost`;
      pantonePrintValue.innerHTML = `${ink.toFixed(4)} kg / ₹${pantoneCostValues[code].toFixed(2)}`;

      // Add additional Pantone colors to extra table
      if (pantoneEntries.length > 1) {
        const extraRows = pantoneEntries.slice(1).map(([code, ink]) => `
          <tr>
            <td>Pantone ${code} Ink / Cost</td>
            <td>${ink.toFixed(4)} kg / ₹${pantoneCostValues[code].toFixed(2)}</td>
          </tr>
        `).join('');
        pantoneExtraPrint.innerHTML = `
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${extraRows}
            </tbody>
          </table>
        `;
      } else {
        pantoneExtraPrint.innerHTML = '';
      }
    } else {
      pantonePrintLabel.innerHTML = '';
      pantonePrintValue.innerHTML = '';
      pantoneExtraPrint.innerHTML = '';
    }

    document.getElementById('totalAreaPrint').textContent = totalArea.toFixed(2);
    document.getElementById('totalInkPrint').textContent = totalInk.toFixed(4);
    document.getElementById('totalCostPrint').textContent = totalCost.toFixed(2);

    document.getElementById('uvWidthPrint').textContent = uvWidthMm.toFixed(1);
    document.getElementById('uvSingleJobLengthPrint').textContent = uvSingleJobLength.toFixed(4);
    document.getElementById('uvTotalAreaPrint').textContent = uvTotalArea.toFixed(2);
    document.getElementById('uvUsagePrint').textContent = uvUsage.toFixed(4);
    document.getElementById('uvCostPrint').textContent = uvCost.toFixed(2);

    document.getElementById('report').classList.remove('hidden');

    // Reset tabs and show the first one
    document.querySelectorAll('.tab-content > div').forEach(div => div.classList.add('hidden'));
    document.getElementById('content-roll').classList.remove('hidden');
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
      btn.classList.add('text-gray-500', 'border-transparent');
      btn.classList.remove('text-blue-600', 'border-blue-500');
    });
    const rollTab = document.getElementById('tab-roll');
    rollTab.classList.add('active', 'text-blue-600', 'border-blue-500');
    rollTab.classList.remove('text-gray-500', 'border-transparent');
  }

  function getAniloxBCM(colorId) {
    const select = document.getElementById(`anilox${colorId}`);
    if (select.value === 'custom') {
      const customBCM = document.getElementById(`customAnilox${colorId}BCM`);
      return customBCM ? parseFloat(customBCM.value) || 2.0 : 2.0;
    }
    return parseFloat(select.value) || 2.0;
  }

  // Tab functionality
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content > div');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('text-gray-500', 'border-transparent');
        btn.classList.remove('text-blue-600', 'border-blue-500');
      });
      tab.classList.add('active', 'text-blue-600', 'border-blue-500');
      tab.classList.remove('text-gray-500', 'border-transparent');

      contents.forEach(content => content.classList.add('hidden'));
      const contentId = `content-${tab.id.split('-')[1]}`;
      document.getElementById(contentId).classList.remove('hidden');
    });
  });

  // Print functionality
  document.getElementById('printReport').addEventListener('click', () => {
    const style = document.createElement('style');
    style.textContent = `
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        font-size: 8pt;
      }
      #printableReport {
        width: 100%;
        box-sizing: border-box;
      }
      .report-header {
        text-align: center;
        margin-bottom: 5mm;
        padding: 5px;
        background: linear-gradient(to right, #e6f0fa, #ffffff);
        border-bottom: 2px solid #1a3c34;
      }
      .report-header h1 {
        font-size: 16pt;
        margin: 0;
      }
      .job-details {
        margin-bottom: 5mm;
      }
      .job-details-table, .report-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 5mm;
      }
      .job-details-table th, .job-details-table td, .report-table th, .report-table td {
        border: 1px solid #ddd;
        padding: 4px;
        text-align: left;
      }
      .job-details-table th, .report-table th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      .pantone-extra {
        margin-top: 5mm;
      }
      .pantone-extra table {
        width: 100%;
        border-collapse: collapse;
      }
      .pantone-extra th, .pantone-extra td {
        border: 1px solid #ddd;
        padding: 4px;
        text-align: left;
      }
      .report-footer {
        text-align: center;
        margin-top: 5mm;
        font-size: 8pt;
        color: #666;
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  });

  // Event listeners
  document.getElementById('materialType').addEventListener('change', toggleCustomMaterial);
  document.getElementById('inkType').addEventListener('change', updateInkCosts);
  document.getElementById('calculateButton').addEventListener('click', calculateInk);
  updateInkCosts(); // Initialize ink costs
});