import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Code, Home, Box, Mail, Loader2, ChevronLeft, ChevronRight, Mic, MicOff, Minus, Plus } from 'lucide-react';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [color, setColor] = useState('#0047AB');
  const [colorScheme, setColorScheme] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [sections, setSections] = useState([]);
  const [sectionInputs, setSectionInputs] = useState({});
  const [showSectionForm, setShowSectionForm] = useState(false);

  
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const fullText = "Use our AI-powered tool to generate a personalized website by simply describing your needs. It's easy, fast, and intuitive!";
  
  useEffect(() => {
    // Reset text and index when slide changes
    setDisplayText('');
    setTextIndex(0);
    
    // Create the interval
    const interval = setInterval(() => {
      setTextIndex(prevIndex => {
        if (prevIndex >= fullText.length) {
          clearInterval(interval);
          return prevIndex;
        }
        
        setDisplayText(prevText => prevText + fullText[prevIndex]);
        return prevIndex + 1;
      });
    }, 30);
    
    // Cleanup
    return () => clearInterval(interval);
  }, [currentSlide]); 
  
  // Speech Recognition Initialization
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
  
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(transcript);
        setShowSparkles(true);
        setIsListening(false);
      };
  
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
  
      recognition.onend = () => {
        setIsListening(false);
      };
  
      setRecognition(recognition);
    }
  }, []); // Only initialize once, on mount
  
  // Toggle Speech Recognition
  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser');
      return;
    }
  
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  };
  




  const handleInputChange = (event) => {
    setPrompt(event.target.value);
    setShowSparkles(event.target.value.length > 0);
  };

  const handleColorChange = (event) => {
    setColor(event.target.value);
  };

  const fetchColorScheme = async () => {
    try {
      const response = await axios.get(`https://www.thecolorapi.com/scheme`, {
        params: {
          hex: color.replace('#', ''),
          format: 'json',
          mode: 'triad',
          count: 6,
        },
      });
      setColorScheme(response.data.colors);
    } catch (error) {
      console.error('Error fetching color scheme:', error);
    }
  };

    const handleAddSection = () => {
      setSections([...sections, { label: '', placeholder: '' }]);
    };
  
    const handleRemoveSection = (index) => {
      const newSections = [...sections];
      newSections.splice(index, 1);
      setSections(newSections);
      
      // Also update sectionInputs to remove the deleted section
      const updatedSectionInputs = { ...sectionInputs };
      delete updatedSectionInputs[sections[index].label];
      setSectionInputs(updatedSectionInputs);
    };
  
    const handleSectionChange = (index, field, value) => {
      const newSections = [...sections];
      const oldLabel = newSections[index].label; // Store the old label
      newSections[index][field] = value;
      setSections(newSections);
  
      // If we're changing a label, we need to update the sectionInputs structure
      if (field === 'label') {
        const updatedSectionInputs = { ...sectionInputs };
        if (oldLabel) {
          delete updatedSectionInputs[oldLabel];
        }
        if (value) { // Only add if the new label is not empty
          updatedSectionInputs[value] = {
            content: '',
            placeholder: newSections[index].placeholder
          };
        }
        setSectionInputs(updatedSectionInputs);
      }
      
      // If we're changing a placeholder, update it in sectionInputs
      if (field === 'placeholder' && newSections[index].label) {
        setSectionInputs(prev => ({
          ...prev,
          [newSections[index].label]: {
            ...prev[newSections[index].label],
            placeholder: value
          }
        }));
      }
    };
  
    const handleCreateSections = () => {
      // Create a key-value object of section labels and placeholders
      const sectionData = {};
      sections.forEach(section => {
        if (section.label) {
          sectionData[section.label] = {
            content: '',
            placeholder: section.placeholder || ''
          };
        }
      });
      setSectionInputs(sectionData);
      setShowSectionForm(true);
    };
  
    const handleSectionInputChange = (label, value) => {
      setSectionInputs(prev => ({
        ...prev,
        [label]: {
          ...prev[label],
          content: value
        }
      }));
    };
  
    const handleSubmit = async (event) => {
      event.preventDefault();
      setIsLoading(true);
      setShowSparkles(false);
  
      try {
        // Create the sections object in the desired format
        const sectionsKeyValue = {};
        sections.forEach(section => {
          if (section.label) {
            sectionsKeyValue[section.label] = section.placeholder;
          }
        });
  
        // Create the sections data array with content
        const sectionsData = Object.entries(sectionInputs).map(([label, data]) => ({
          label,
          content: data.content || 'No content provided',
          placeholder: data.placeholder || ''
        }));
  
        // Validate required data
        if (!prompt.trim()) {
          throw new Error('Please provide a prompt');
        }
  
        if (colorScheme.length === 0) {
          throw new Error('Please generate a color scheme');
        }
  
        if (Object.keys(sectionsKeyValue).length === 0) {
          throw new Error('Please add at least one section');
        }
  
        console.log('Sending data:', {
          prompt,
          colorPalette: colorScheme.map((color) => color.hex.value),
          sections: sectionsData,
          sectionsKeyValue
        });
  
        const response = await axios.post('http://localhost:5000/api/generate', {
          prompt,
          colorPalette: colorScheme.map((color) => color.hex.value),
          sections: sectionsData,
          sectionsKeyValue
        });
  
        const { html, css, js } = response.data.code;
        const sectionsHTML = sectionsData
          .map(({ label, content }) => `
            <div class="website-section">
              <h2>${label}</h2>
              <div class="section-content">${content}</div>
            </div>
          `)
          .join('');
  
  

      const compiledHTML = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/grapesjs/0.21.2/css/grapes.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/grapesjs/0.21.2/grapes.min.js"></script>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
      }
      #gjs {
        height: calc(100% - 40px);
        width: 100%;
        margin-top: 3.75px;
      }
      .gjs-cv-canvas {
  width: 1020px;
  align-items: centre;
   /* Adjust width as needed */
}

      .panel__top {
        padding: 0;
        width: 100%;
        display: flex;
        position: absolute;
        top: 0;
        left: 0;
        height: 40px;
        justify-content: center;
        background-color: #444;
      }
      .panel__basic-actions {
        position: absolute;
        left: 0;
        top: 0;
        display: flex;
        justify-content: flex-start;
        padding: 0 10px;
        width: 100%;
        height: 40px;
        align-items: center;
      }
      .panel__basic-actions button {
        margin-right: 10px;
        background-color: #fff;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
      }
      .panel__basic-actions button:hover {
        background-color: #ddd;
      }
      .panel__right {
        position: fixed;
        right: 0;
        top: 40px;
        width: 250px;
        height: calc(100% - 40px);
        overflow-y: auto;
        background-color: #fff;
        border-left: 1px solid #ddd;
      }
      .gjs-pn-views-container {
        height: 100%;
        padding: 10px;
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    <div class="panel__top">
      <div class="panel__basic-actions"></div>
    </div>
    <div id="gjs">${html}</div>
    <div class="panel__right">
      <div class="layers-container"></div>
      <div class="styles-container"></div>
      <div class="blocks-container"></div>
    </div>

    <script>
      window.onload = function() {
        const editor = grapesjs.init({
          container: '#gjs',
          height: '100%',
          width: 'auto',
          fromElement: true,
          showOffsets: true,
          storageManager: false,
          panels: {
            defaults: [
              {
                id: 'basic-actions',
                el: '.panel__basic-actions',
                buttons: [
                  {
                    id: 'visibility',
                    active: true,
                    className: 'btn-toggle-borders',
                    label: 'Borders',
                    command: 'sw-visibility',
                  },
                  {
                    id: 'show-layers',
                    active: false,
                    className: 'btn-toggle-layers',
                    label: 'Layers',
                    command: 'show-layers',
                  },
                  {
                    id: 'show-style',
                    active: false,
                    className: 'btn-toggle-styles',
                    label: 'Styles',
                    command: 'show-styles',
                  },
                  {
                    id: 'show-blocks',
                    active: false,
                    className: 'btn-toggle-blocks',
                    label: 'Blocks',
                    command: 'show-blocks',
                  },
                  {
                    id: 'export',
                    className: 'btn-open-export',
                    label: 'Code',
                    command: 'export-template',
                  },
                  {
                    id: 'download',
                    className: 'btn-download',
                    label: 'Download',
                    command: 'download-files',
                  },
                ],
              }
            ]
          },
          layerManager: {
            appendTo: '.layers-container'
          },
          styleManager: {
            appendTo: '.styles-container',
            sectors: [
              {
                name: 'Dimension',
                open: false,
                properties: ['width', 'height', 'padding', 'margin']
              },
              {
                name: 'Typography',
                open: false,
                properties: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-shadow']
              },
              {
                name: 'Decorations',
                open: false,
                properties: ['background-color', 'border-radius', 'border', 'box-shadow', 'background']
              },
            ]
          },
          blockManager: {
            appendTo: '.blocks-container',
            blocks: [
              {
                id: 'section',
                label: 'Section',
                content: '<section class="bdg-sect"><h1>This is a section</h1></section>',
              },
              {
                id: 'text',
                label: 'Text',
                content: '<div data-gjs-type="text">Insert your text here</div>',
              },
              {
                id: 'image',
                label: 'Image',
                content: { type: 'image' },
              },
            ]
          }
        });

        // Toggle sidebar panels
        let currentPanel = null;

        editor.Commands.add('show-layers', {
          run(editor) {
            const lm = editor.LayerManager;
            document.querySelector('.layers-container').style.display = 'block';
            document.querySelector('.styles-container').style.display = 'none';
            document.querySelector('.blocks-container').style.display = 'none';
            currentPanel = 'layers';
            lm.render();
          },
          stop(editor) {
            document.querySelector('.layers-container').style.display = 'none';
            currentPanel = null;
          }
        });

        editor.Commands.add('show-styles', {
          run(editor) {
            const sm = editor.StyleManager;
            document.querySelector('.styles-container').style.display = 'block';
            document.querySelector('.layers-container').style.display = 'none';
            document.querySelector('.blocks-container').style.display = 'none';
            currentPanel = 'styles';
            sm.render();
          },
          stop(editor) {
            document.querySelector('.styles-container').style.display = 'none';
            currentPanel = null;
          }
        });

        editor.Commands.add('show-blocks', {
          run(editor) {
            const bm = editor.BlockManager;
            document.querySelector('.blocks-container').style.display = 'block';
            document.querySelector('.layers-container').style.display = 'none';
            document.querySelector('.styles-container').style.display = 'none';
            currentPanel = 'blocks';
            bm.render();
          },
          stop(editor) {
            document.querySelector('.blocks-container').style.display = 'none';
            currentPanel = null;
          }
        });

                       editor.Commands.add('download-files', {
          run: function(editor) {
            const editorHtml = editor.getHtml();
            const editorCss = editor.getCss();
            
            // Create HTML file
            const downloadHtmlContent = \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    \${editorHtml}
</body>
</html>\`;

            // Create Blobs for the files
            const htmlBlob = new Blob([downloadHtmlContent], { type: 'text/html' });
            const cssBlob = new Blob([editorCss], { type: 'text/css' });

            // Create download links
            const htmlUrl = URL.createObjectURL(htmlBlob);
            const cssUrl = URL.createObjectURL(cssBlob);

            // Create and trigger download for HTML
            const htmlLink = document.createElement('a');
            htmlLink.href = htmlUrl;
            htmlLink.download = 'index.html';
            document.body.appendChild(htmlLink);
            htmlLink.click();
            document.body.removeChild(htmlLink);

            // Create and trigger download for CSS
            const cssLink = document.createElement('a');
            cssLink.href = cssUrl;
            cssLink.download = 'styles.css';
            document.body.appendChild(cssLink);
            cssLink.click();
            document.body.removeChild(cssLink);

            // Clean up
            URL.revokeObjectURL(htmlUrl);
            URL.revokeObjectURL(cssUrl);
          }
        });
        // Hide all panels initially
        document.querySelector('.layers-container').style.display = 'none';
        document.querySelector('.styles-container').style.display = 'none';
        document.querySelector('.blocks-container').style.display = 'none';

        // Load styles
        editor.CssComposer.clear();
        editor.setStyle(${JSON.stringify(css)});

        // Load JavaScript
        if (${JSON.stringify(js)}) {
          const scriptElement = document.createElement('script');
          scriptElement.textContent = ${JSON.stringify(js)};
          document.body.appendChild(scriptElement);
        }
      };
    </script>
  </body>
</html>
      `;

      const newWindow = window.open();
      if (!newWindow) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }
      newWindow.document.write(compiledHTML);
      newWindow.document.close();

    } catch (error) {
      console.error('Error generating website:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const slides = [
    {
      title: "Describe Your Website",
      description: displayText, // Use the animated text here
      type: "input",
      content: (
        <div className="input-slide">
  <input
    type="text"
    value={prompt}
    onChange={handleInputChange}
    placeholder="Describe your website idea..."
    className="carousel-input"
  />
  <button
    onClick={toggleListening}
    className={`mic-button ${isListening ? 'listening' : ''}`}
    title={isListening ? 'Stop listening' : 'Start listening'}
  >
    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
  </button>
  {showSparkles && <Sparkles className="sparkle-icon" size={20} />}
</div>

      )
    },
    {
      title: "Pick Your Colors",
      description: "Pick a seed color to generate a color scheme.",
      type: "color-picker",
      content: (
        <div className="color-picker-section">
          <label htmlFor="color-picker">Pick a Seed Color:</label>
          <input
            type="color"
            id="color-picker"
            value={color}
            onChange={handleColorChange}
          />
          <button className="fetch-color-scheme" onClick={fetchColorScheme}>
            Generate Color Scheme
          </button>
          {colorScheme.length > 0 && (
            <div className="color-scheme">
              <h3>Generated Color Scheme</h3>
              <div className="color-palette">
                {colorScheme.map((colorItem, index) => (
                  <div
                    key={index}
                    className="color-swatch"
                    style={{ backgroundColor: colorItem.hex.value }}
                  >
                    <span>{colorItem.hex.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: "Website Sections",
      description: "Define the sections for your website",
      type: "final",
      content: (
        <div className="sections-slide">
          <div className="section-creator">
            <div className="sections-list">
              {sections.map((section, index) => (
                <div key={index} className="section-item">
                  <div className="section-inputs">
                    <input
                      type="text"
                      value={section.label}
                      onChange={(e) =>
                        handleSectionChange(index, "label", e.target.value)
                      }
                      placeholder="Section Label"
                      className="section-input"
                    />
                    <input
                      type="text"
                      value={section.placeholder}
                      onChange={(e) =>
                        handleSectionChange(index, "placeholder", e.target.value)
                      }
                      placeholder="Input Placeholder"
                      className="section-input"
                    />
                  </div>
                  <button
                    className="remove-section"
                    onClick={() => handleRemoveSection(index)}
                  >
                    <Minus size={20} />
                  </button>
                </div>
              ))}
            </div>
  
            <div className="section-buttons">
              <button className="add-section" onClick={handleAddSection}>
                <Plus size={20} />
                Add Section
              </button>
              {sections.length > 0 && (
                <button className="create-sections" onClick={handleCreateSections}>
                  Create Sections
                </button>
              )}
            </div>
          </div>
        </div>
      ),
    },

    {
      title: "Generate Your Website",
      description: "Ready to generate your custom website?",
      type: "final",
      content: (
        <form className="final-slide-form" onSubmit={handleSubmit}>
          <button
            type="submit"
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="spin-icon" size={20} />
                Generating...
              </>
            ) : (
              'Generate Website'
            )}
          </button>
        </form>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  return (
    <div className="App">
      <div className="home-page">
        <nav className="navbar">
          <ul>
            <li className="nav-item">
              <Home className="nav-icon" size={20} />
              <span>Home</span>
            </li>
            <li className="nav-item">
              <Box className="nav-icon" size={20} />
              <span>Features</span>
            </li>
            <li className="nav-item">
              <Mail className="nav-icon" size={20} />
              <span>Contact</span>
            </li>
          </ul>
        </nav>

        <div className="content">
          <div className="carousel-container">
            <div className="carousel">
              <button className="carousel-button prev" onClick={prevSlide}>
                <ChevronLeft size={24} />
              </button>

              <div className="carousel-content">
                <h1 className="carousel-title">{slides[currentSlide].title}</h1>
                <p className="carousel-description">{slides[currentSlide].description}</p>
                {slides[currentSlide].content}
              </div>

              <button className="carousel-button next" onClick={nextSlide}>
                <ChevronRight size={24} />
              </button>

              <div className="carousel-dots">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    className={`carousel-dot ${currentSlide === index ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
