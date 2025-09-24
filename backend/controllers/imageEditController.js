const axios = require('axios');
const User = require('../models/User');
require('dotenv').config();

/**
 * @desc    Edit image using n8n webhook
 * @route   POST /api/image-edit
 * @access  Private
 */
exports.editImage = async (req, res) => {
  const { prompt, image_url, cardId, category, item } = req.body;
  
  // Check if user has enough credits
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      status: 'fail',
      error: 'User not found'
    });
  }
  
  // Check if user has selected a plan
  if (!user.plan) {
    return res.status(403).json({
      status: 'fail',
      error: 'Please select a plan to generate images',
      redirectTo: '/pricing'
    });
  }
  
  // Check if user has enough credits
  if (user.credits.balance <= 0) {
    return res.status(403).json({
      status: 'fail',
      error: 'You have run out of credits. Please upgrade your plan.',
      redirectTo: '/pricing'
    });
  }

  // Validate input
  if (!prompt || !image_url) {
    return res.status(400).json({ 
      status: 'fail',
      error: 'prompt and image_url are required' 
    });
  }
  
  // Validate image URL format
  try {
    new URL(image_url);
  } catch (e) {
    console.error('Invalid image URL format:', image_url);
    return res.status(422).json({ 
      status: 'fail',
      error: 'Invalid image URL format' 
    });
  }

  try {
    // Get the appropriate webhook URL based on cardId or category
    let n8nWebhookUrl;
    let webhookKey = '';
    
    if (cardId) {
      // Fix cardId format if it contains hyphens (e.g., product-type-jeans)
      let formattedCardId = cardId;
      let originalCardId = cardId;
      
      // Store both hyphen and underscore versions
      let hyphenVersion = cardId;
      let underscoreVersion = cardId;
      
      // Check if cardId is in format like "product-type-jeans"
      const cardParts = cardId.split('-');
      if (cardParts.length >= 3) {
        // Reconstruct to proper format for env variable lookup
        const categoryPart = `${cardParts[0]}_${cardParts[1]}`;
        const itemPart = cardParts.slice(2).join('_');
        formattedCardId = `${categoryPart}_${itemPart}`;
        underscoreVersion = formattedCardId;
        console.log(`Reformatted cardId from ${cardId} to ${formattedCardId}`);
      } else if (cardId.includes('-')) {
        underscoreVersion = cardId.replace(/-/g, '_');
        formattedCardId = underscoreVersion;
      } else if (cardId.includes('_')) {
        hyphenVersion = cardId.replace(/_/g, '-');
      }
      
      // Map cardId to corresponding webhook environment variable
      // Extract category and item from cardId if not already defined
      let categoryKey = category || '';
      let itemKey = item || '';
      
      // If category/item not provided, try to extract from cardId
      if ((!categoryKey || !itemKey) && cardId) {
        if (cardId.includes('-')) {
          const parts = cardId.split('-');
          if (parts.length >= 2) {
            // For hyphenated format like "product-type-jeans"
            categoryKey = `${parts[0]}_${parts[1]}`;
            itemKey = parts.slice(2).join('_');
            
            // If no item part, adjust accordingly
            if (parts.length === 2) {
              categoryKey = parts[0];
              itemKey = parts[1];
            }
          }
        } else if (cardId.includes('_')) {
          const parts = cardId.split('_');
          if (parts.length >= 2) {
            // For underscore format like "product_type_jeans"
            categoryKey = `${parts[0]}_${parts[1]}`;
            itemKey = parts.slice(2).join('_');
            
            // If no item part, adjust accordingly
            if (parts.length === 2) {
              categoryKey = parts[0];
              itemKey = parts[1];
            }
          }
        }
      }
      
      // Convert category key to standard format
      if (categoryKey === 'scene' || categoryKey === 'location') {
        categoryKey = 'scene_loc';
      } else if (categoryKey === 'shot' || categoryKey === 'style') {
        categoryKey = 'shot_style';
      } else if (categoryKey === 'mood' || categoryKey === 'genre') {
        categoryKey = 'mood_genre';
      } else if (categoryKey === 'target' || categoryKey === 'channel') {
        categoryKey = 'target_channel';
      } else if (categoryKey === 'product' || categoryKey === 'type') {
        categoryKey = 'product_type';
      }
      
      console.log(`Using category: ${categoryKey}, item: ${itemKey} from cardId: ${cardId}`);
      
      // Try multiple formats to find the correct webhook URL
      let possibleWebhookKeys = [
        // Format 1: With CARD prefix and underscore version
        `CARD${underscoreVersion.toUpperCase()}_N8N_WEBHOOK`,
        // Format 2: With CARD prefix and hyphen version
        `CARD${hyphenVersion.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
        // Format 3: Without prefix, underscore version
        `${underscoreVersion.toUpperCase()}_N8N_WEBHOOK`,
        // Format 4: Without prefix, hyphen version converted to underscore
        `${hyphenVersion.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`
      ];
      
      // First try direct pattern matching based on category
       if (categoryKey && itemKey) {
         // Scene Location patterns
         if (categoryKey === 'scene_loc' || categoryKey.includes('scene') || categoryKey.includes('location')) {
           possibleWebhookKeys = [
             ...possibleWebhookKeys,
             `SCENE_LOCATION_AMBIENCE_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             `SCENE_LOCATION_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             `SCENE_LOC_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             `SCENE_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             'SCENE_LOCATION_AMBIENCE_N8N_WEBHOOK',
             'SCENE_LOCATION_N8N_WEBHOOK',
             'SCENE_LOC_N8N_WEBHOOK'
           ];
         }
         
         // Shot Style patterns
         if (categoryKey === 'shot_style' || categoryKey.includes('shot') || categoryKey.includes('style')) {
           possibleWebhookKeys = [
             ...possibleWebhookKeys,
             `SHOT_STYLE_USE_CASE_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             `SHOT_STYLE_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             `SHOT_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             'SHOT_STYLE_USE_CASE_N8N_WEBHOOK',
             'SHOT_STYLE_N8N_WEBHOOK'
           ];
           
           // Special handling for lookbook
           if (itemKey.includes('lookbook') || (cardId && cardId.includes('lookbook'))) {
             possibleWebhookKeys = [
               ...possibleWebhookKeys,
               'SHOT_STYLE_USE_CASE_LOOKBOOK_FULL_BODY_N8N_WEBHOOK',
               'LOOKBOOK_FULL_BODY_N8N_WEBHOOK',
               'LOOKBOOK_N8N_WEBHOOK'
             ];
           }
           
           // Special handling for hero-banner
           if (itemKey.includes('hero') || itemKey.includes('banner') || (cardId && (cardId.includes('hero') || cardId.includes('banner')))) {
             possibleWebhookKeys = [
               ...possibleWebhookKeys,
               'SHOT_STYLE_USE_CASE_HERO_BANNER_N8N_WEBHOOK',
               'HERO_BANNER_N8N_WEBHOOK'
             ];
           }
         }
         
         // Mood Genre patterns
         if (categoryKey === 'mood_genre' || categoryKey.includes('mood') || categoryKey.includes('genre')) {
           possibleWebhookKeys = [
             ...possibleWebhookKeys,
             `MOOD_GENRE_FINISHES_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             `MOOD_GENRE_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             `MOOD_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             'MOOD_GENRE_FINISHES_N8N_WEBHOOK',
             'MOOD_GENRE_N8N_WEBHOOK'
           ];
         }
         
         // Target Channel patterns
         if (categoryKey === 'target_channel' || categoryKey.includes('target') || categoryKey.includes('channel')) {
           possibleWebhookKeys = [
             ...possibleWebhookKeys,
             `TARGET_CHANNEL_PRESETS_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             `TARGET_CHANNEL_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             `CHANNEL_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             'TARGET_CHANNEL_PRESETS_N8N_WEBHOOK',
             'TARGET_CHANNEL_N8N_WEBHOOK'
           ];
           
           // Special handling for amazon-flipkart
           if (itemKey.includes('amazon') || itemKey.includes('flipkart') || (cardId && (cardId.includes('amazon') || cardId.includes('flipkart')))) {
             possibleWebhookKeys = [
               ...possibleWebhookKeys,
               'TARGET_CHANNEL_PRESETS_AMAZON_FLIPKART_LISTING_N8N_WEBHOOK',
               'AMAZON_FLIPKART_LISTING_N8N_WEBHOOK',
               'AMAZON_FLIPKART_N8N_WEBHOOK'
             ];
           }
         }
         
         // Product Type patterns
         if (categoryKey === 'product_type' || categoryKey.includes('product') || categoryKey.includes('type')) {
           possibleWebhookKeys = [
             ...possibleWebhookKeys,
             `PRODUCT_TYPE_${itemKey.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`,
             'PRODUCT_TYPE_N8N_WEBHOOK'
           ];
         }
       }
      
      // Remove duplicates
      possibleWebhookKeys = [...new Set(possibleWebhookKeys)];
      
      // Add category specific formats if category and item are available
      if (categoryKey && itemKey) {
        // Format 5: Category specific format (e.g., SHOT_STYLE_HERO_BANNER)
        possibleWebhookKeys.push(`${categoryKey.toUpperCase()}_${itemKey.toUpperCase()}_${cardId.split('-').slice(2).join('_').toUpperCase()}_N8N_WEBHOOK`);
      }
      
      // Format 6: Direct match with cardId
      possibleWebhookKeys.push(`${cardId.toUpperCase().replace(/-/g, '_')}_N8N_WEBHOOK`);
      
      // Try each possible webhook key
      console.log('Trying to find webhook URL with these possible keys:', possibleWebhookKeys);
      for (const key of possibleWebhookKeys) {
        if (process.env[key]) {
          webhookKey = key;
          n8nWebhookUrl = process.env[key];
          console.log(`Found webhook URL using key: ${webhookKey}`);
          break;
        }
      }
      
      if (!n8nWebhookUrl) {
        console.log('No webhook URL found, using default');
      }
      
      if (!n8nWebhookUrl) {
        console.log(`Webhook URL not found for card: ${cardId} (tried multiple keys), using default webhook`);
        n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
      } else {
        console.log(`Using specific webhook for card ${cardId}: ${webhookKey}`);
      }
    } else if (category && item) {
      // Handle category-based webhook selection
      // First clean up category and item
      const cleanCategory = category.replace(/[^a-z0-9-]/gi, '').toLowerCase();
      const cleanItem = item.replace(/[^a-z0-9-]/gi, '').toLowerCase();
      
      // Convert hyphens to underscores for env variable lookup
      const categoryKey = cleanCategory.replace(/-/g, '_');
      const itemKey = cleanItem.replace(/-/g, '_');
      
      console.log(`Looking for webhook with category: ${categoryKey}, item: ${itemKey}`);
      
      // Try specific category-item webhook first - format: CATEGORY_ITEM
      webhookKey = `${categoryKey}_${itemKey}_N8N_WEBHOOK`.toUpperCase();
      n8nWebhookUrl = process.env[webhookKey];
      console.log(`Trying webhook key: ${webhookKey}`);
      
      // Special handling for target_channel category
      if (!n8nWebhookUrl && categoryKey === 'target_channel') {
        // Try with PRESETS format first (most common in .env)
        webhookKey = `TARGET_CHANNEL_PRESETS_${itemKey.toUpperCase()}_N8N_WEBHOOK`;
        n8nWebhookUrl = process.env[webhookKey];
        console.log(`Trying TARGET_CHANNEL_PRESETS format: ${webhookKey}`);
        
        // If not found, try with formatted item (replace underscores with hyphens)
        if (!n8nWebhookUrl) {
          const formattedItem = itemKey.replace(/_/g, '-');
          const hyphenFormattedKey = formattedItem.toUpperCase().replace(/-/g, '_');
          webhookKey = `TARGET_CHANNEL_PRESETS_${hyphenFormattedKey}_N8N_WEBHOOK`;
          n8nWebhookUrl = process.env[webhookKey];
          console.log(`Trying hyphen-formatted webhook key: ${webhookKey}`);
        }
        
        // If still not found, try original format
        if (!n8nWebhookUrl) {
          webhookKey = `${categoryKey.toUpperCase()}_PRESETS_${itemKey.toUpperCase()}_N8N_WEBHOOK`;
          n8nWebhookUrl = process.env[webhookKey];
          console.log(`Trying original format: ${webhookKey}`);
        }
        
        // Try direct URL format as in .env file
        if (!n8nWebhookUrl) {
          // Check for channel-* format URLs
          const channelKey = `channel-${itemKey.replace(/_/g, '-').toLowerCase()}`;
          console.log(`Trying direct channel URL format: ${channelKey}`);
          
          // Loop through all environment variables to find matching URL
          for (const envKey in process.env) {
            if (process.env[envKey] && process.env[envKey].includes(channelKey)) {
              n8nWebhookUrl = process.env[envKey];
              webhookKey = envKey;
              console.log(`Found matching URL by pattern: ${webhookKey}`);
              break;
            }
          }
        }
      }
      
      // If not found, try with special formats for other categories
      if (!n8nWebhookUrl) {
        // Try to find webhook URL by direct URL pattern matching first
        // This helps with finding the correct webhook URL even if the naming convention is different
        const categoryUrlPatterns = {
          'scene_loc': 'scene-',
          'scene_location': 'scene-',
          'shot_style': 'shot-',
          'mood_genre': 'mood-',
          'target_channel': 'channel-'
        };
        
        // Get the URL pattern for the current category
        const urlPattern = categoryUrlPatterns[categoryKey];
        
        if (urlPattern && itemKey) {
          // Format the item key for URL pattern matching
          const formattedItemForUrl = itemKey.replace(/_/g, '-').toLowerCase();
          const fullPattern = `${urlPattern}${formattedItemForUrl}`;
          console.log(`Trying to find webhook URL with pattern: ${fullPattern}`);
          
          // Search through all environment variables for a matching URL
          for (const envKey in process.env) {
            if (process.env[envKey] && 
                process.env[envKey].includes(fullPattern) && 
                envKey.includes('N8N_WEBHOOK')) {
              n8nWebhookUrl = process.env[envKey];
              webhookKey = envKey;
              console.log(`Found webhook URL by pattern matching: ${webhookKey} -> ${fullPattern}`);
              break;
            }
          }
        }
        
        // If still not found, try category-specific formats
        if (!n8nWebhookUrl) {
          if (categoryKey === 'scene_loc' || categoryKey === 'scene_location') {
            // Direct mapping for scene_loc to SCENE_LOCATION_AMBIENCE
            webhookKey = 'SCENE_LOCATION_AMBIENCE_N8N_WEBHOOK';
            n8nWebhookUrl = process.env[webhookKey];
            console.log(`Trying standard format webhook key: ${webhookKey}`);
            
            // If specific item is provided, try with that item directly
            if (!n8nWebhookUrl && itemKey) {
              // Try multiple formats for scene location
              const sceneLocationFormats = [
                `SCENE_LOCATION_AMBIENCE_${itemKey.toUpperCase()}_N8N_WEBHOOK`,
                `SCENE_LOCATION_${itemKey.toUpperCase()}_N8N_WEBHOOK`,
                `SCENE_LOC_${itemKey.toUpperCase()}_N8N_WEBHOOK`,
                `SCENE_${itemKey.toUpperCase()}_N8N_WEBHOOK`
              ];
              
              // Try each format
              for (const format of sceneLocationFormats) {
                if (process.env[format]) {
                  webhookKey = format;
                  n8nWebhookUrl = process.env[format];
                  console.log(`Found scene location webhook using key: ${webhookKey}`);
                  break;
                }
              }
              
              // If still not found, try with formatted item (hyphen version)
              if (!n8nWebhookUrl) {
                const formattedItem = itemKey.replace(/_/g, '-');
                const hyphenFormattedKey = formattedItem.toUpperCase().replace(/-/g, '_');
                
                const hyphenFormats = [
                  `SCENE_LOCATION_AMBIENCE_${hyphenFormattedKey}_N8N_WEBHOOK`,
                  `SCENE_LOCATION_${hyphenFormattedKey}_N8N_WEBHOOK`,
                  `SCENE_LOC_${hyphenFormattedKey}_N8N_WEBHOOK`,
                  `SCENE_${hyphenFormattedKey}_N8N_WEBHOOK`
                ];
                
                for (const format of hyphenFormats) {
                  if (process.env[format]) {
                    webhookKey = format;
                    n8nWebhookUrl = process.env[format];
                    console.log(`Found scene location webhook using hyphen key: ${webhookKey}`);
                    break;
                  }
                }
              }
              
              // If still not found, try with capitalized words
              if (!n8nWebhookUrl) {
                const words = itemKey.split('_');
                const capitalizedWords = words.map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join('_');
                
                webhookKey = `SCENE_LOCATION_AMBIENCE_${capitalizedWords.toUpperCase()}_N8N_WEBHOOK`;
                n8nWebhookUrl = process.env[webhookKey];
                console.log(`Trying with capitalized words: ${webhookKey}`);
              }
            }
          } else if (categoryKey === 'shot_style') {
            // Direct mapping for shot_style to SHOT_STYLE_USE_CASE
            webhookKey = 'SHOT_STYLE_USE_CASE_N8N_WEBHOOK';
            n8nWebhookUrl = process.env[webhookKey];
            console.log(`Trying standard format webhook key: ${webhookKey}`);
            
            // If specific item is provided, try with that item directly
            if (!n8nWebhookUrl && itemKey) {
              // Try multiple formats for shot style
              const shotStyleFormats = [
                `SHOT_STYLE_USE_CASE_${itemKey.toUpperCase()}_N8N_WEBHOOK`,
                `SHOT_STYLE_${itemKey.toUpperCase()}_N8N_WEBHOOK`,
                `SHOT_${itemKey.toUpperCase()}_N8N_WEBHOOK`
              ];
              
              // Try each format
              for (const format of shotStyleFormats) {
                if (process.env[format]) {
                  webhookKey = format;
                  n8nWebhookUrl = process.env[format];
                  console.log(`Found shot style webhook using key: ${webhookKey}`);
                  break;
                }
              }
              
              // If not found, try with formatted item (replace underscores with hyphens)
              if (!n8nWebhookUrl) {
                const formattedItem = itemKey.replace(/_/g, '-');
                const hyphenFormattedKey = formattedItem.toUpperCase().replace(/-/g, '_');
                
                const hyphenFormats = [
                  `SHOT_STYLE_USE_CASE_${hyphenFormattedKey}_N8N_WEBHOOK`,
                  `SHOT_STYLE_${hyphenFormattedKey}_N8N_WEBHOOK`,
                  `SHOT_${hyphenFormattedKey}_N8N_WEBHOOK`
                ];
                
                for (const format of hyphenFormats) {
                  if (process.env[format]) {
                    webhookKey = format;
                    n8nWebhookUrl = process.env[format];
                    console.log(`Found shot style webhook using hyphen key: ${webhookKey}`);
                    break;
                  }
                }
              }
              
              // Special handling for hero-banner
              if (!n8nWebhookUrl && (itemKey.includes('hero') || (cardId && cardId.includes('hero')))) {
                // Try specific hero banner formats
                const heroKeys = [
                  'SHOT_STYLE_HERO_BANNER_N8N_WEBHOOK',
                  'SHOT_STYLE_USE_CASE_HERO_BANNER_N8N_WEBHOOK',
                  'HERO_BANNER_N8N_WEBHOOK',
                  'HERO_BANNER_STYLE_N8N_WEBHOOK',
                  'SHOT_HERO_BANNER_N8N_WEBHOOK'
                ];
                
                for (const key of heroKeys) {
                  if (process.env[key]) {
                    webhookKey = key;
                    n8nWebhookUrl = process.env[key];
                    console.log(`Found hero banner webhook using key: ${webhookKey}`);
                    break;
                  }
                }
              }
              
              // Special handling for lookbook style
              if (!n8nWebhookUrl && (itemKey.includes('lookbook') || (cardId && cardId.includes('lookbook')))) {
                // Try specific lookbook formats
                const lookbookKeys = [
                  'SHOT_STYLE_LOOKBOOK_FULL_BODY_N8N_WEBHOOK',
                  'SHOT_STYLE_LOOKBOOK_N8N_WEBHOOK',
                  'LOOKBOOK_FULL_BODY_N8N_WEBHOOK',
                  'LOOKBOOK_N8N_WEBHOOK'
                ];
                
                for (const key of lookbookKeys) {
                  if (process.env[key]) {
                    webhookKey = key;
                    n8nWebhookUrl = process.env[key];
                    console.log(`Found lookbook webhook using key: ${webhookKey}`);
                    break;
                  }
                }
              }
            }
          } else if (categoryKey === 'mood_genre') {
            // Try multiple formats for mood genre
            const moodGenreFormats = [
              'MOOD_GENRE_FINISHES_N8N_WEBHOOK',
              'MOOD_GENRE_N8N_WEBHOOK',
              'MOOD_N8N_WEBHOOK'
            ];
            
            // Try each format
            for (const format of moodGenreFormats) {
              if (process.env[format]) {
                webhookKey = format;
                n8nWebhookUrl = process.env[format];
                console.log(`Found mood genre webhook using key: ${webhookKey}`);
                break;
              }
            }
            
            // If specific item is provided, try with that item directly
            if (!n8nWebhookUrl && itemKey) {
              // Try multiple formats with item
              const itemFormats = [
                `MOOD_GENRE_FINISHES_${itemKey.toUpperCase()}_N8N_WEBHOOK`,
                `MOOD_GENRE_${itemKey.toUpperCase()}_N8N_WEBHOOK`,
                `MOOD_${itemKey.toUpperCase()}_N8N_WEBHOOK`
              ];
              
              // Try each format
              for (const format of itemFormats) {
                if (process.env[format]) {
                  webhookKey = format;
                  n8nWebhookUrl = process.env[format];
                  console.log(`Found mood genre webhook using key: ${webhookKey}`);
                  break;
                }
              }
              
              // If not found, try with formatted item (replace underscores with hyphens)
              if (!n8nWebhookUrl) {
                const formattedItem = itemKey.replace(/_/g, '-');
                const hyphenFormattedKey = formattedItem.toUpperCase().replace(/-/g, '_');
                
                const hyphenFormats = [
                  `MOOD_GENRE_FINISHES_${hyphenFormattedKey}_N8N_WEBHOOK`,
                  `MOOD_GENRE_${hyphenFormattedKey}_N8N_WEBHOOK`,
                  `MOOD_${hyphenFormattedKey}_N8N_WEBHOOK`
                ];
                
                for (const format of hyphenFormats) {
                  if (process.env[format]) {
                    webhookKey = format;
                    n8nWebhookUrl = process.env[format];
                    console.log(`Found mood genre webhook using hyphen key: ${webhookKey}`);
                    break;
                  }
                }
              }
            }
          } else if (categoryKey === 'target_channel') {
            // Try multiple formats for target channel
            const targetChannelFormats = [
              'TARGET_CHANNEL_PRESETS_N8N_WEBHOOK',
              'TARGET_CHANNEL_N8N_WEBHOOK',
              'CHANNEL_N8N_WEBHOOK'
            ];
            
            // Try each format
            for (const format of targetChannelFormats) {
              if (process.env[format]) {
                webhookKey = format;
                n8nWebhookUrl = process.env[format];
                console.log(`Found target channel webhook using key: ${webhookKey}`);
                break;
              }
            }
            
            // If specific item is provided, try with that item directly
            if (!n8nWebhookUrl && itemKey) {
              // Try multiple formats with item
              const itemFormats = [
                `TARGET_CHANNEL_PRESETS_${itemKey.toUpperCase()}_N8N_WEBHOOK`,
                `TARGET_CHANNEL_${itemKey.toUpperCase()}_N8N_WEBHOOK`,
                `CHANNEL_${itemKey.toUpperCase()}_N8N_WEBHOOK`
              ];
              
              // Try each format
              for (const format of itemFormats) {
                if (process.env[format]) {
                  webhookKey = format;
                  n8nWebhookUrl = process.env[format];
                  console.log(`Found target channel webhook using key: ${webhookKey}`);
                  break;
                }
              }
              
              // If not found, try with formatted item (replace underscores with hyphens)
              if (!n8nWebhookUrl) {
                const formattedItem = itemKey.replace(/_/g, '-');
                const hyphenFormattedKey = formattedItem.toUpperCase().replace(/-/g, '_');
                
                const hyphenFormats = [
                  `TARGET_CHANNEL_PRESETS_${hyphenFormattedKey}_N8N_WEBHOOK`,
                  `TARGET_CHANNEL_${hyphenFormattedKey}_N8N_WEBHOOK`,
                  `CHANNEL_${hyphenFormattedKey}_N8N_WEBHOOK`
                ];
                
                for (const format of hyphenFormats) {
                  if (process.env[format]) {
                    webhookKey = format;
                    n8nWebhookUrl = process.env[format];
                    console.log(`Found target channel webhook using hyphen key: ${webhookKey}`);
                    break;
                  }
                }
              }
              
              // Special handling for amazon-flipkart
              if (!n8nWebhookUrl && (itemKey.includes('amazon') || (cardId && cardId.includes('amazon')))) {
                const amazonKeys = [
                  'TARGET_CHANNEL_PRESETS_AMAZON_FLIPKART_LISTING_N8N_WEBHOOK',
                  'CHANNEL_AMAZON_FLIPKART_N8N_WEBHOOK',
                  'AMAZON_FLIPKART_N8N_WEBHOOK'
                ];
                
                for (const key of amazonKeys) {
                  if (process.env[key]) {
                    webhookKey = key;
                    n8nWebhookUrl = process.env[key];
                    console.log(`Found amazon-flipkart webhook using key: ${webhookKey}`);
                    break;
                  }
                }
              }
            }
          }
        }
      }
      
      // If still not found, try category-level webhook
      if (!n8nWebhookUrl) {
        webhookKey = `${categoryKey}_N8N_WEBHOOK`.toUpperCase();
        n8nWebhookUrl = process.env[webhookKey];
        console.log(`Trying category-level webhook key: ${webhookKey}`);
      }
      
      // Special handling for apps card
      if (!n8nWebhookUrl && (itemKey.toLowerCase().includes('app') || categoryKey.toLowerCase().includes('app'))) {
        webhookKey = 'APPS_CARD_N8N_WEBHOOK';
        n8nWebhookUrl = process.env[webhookKey];
        console.log(`Trying apps card webhook: ${webhookKey}`);
        
        if (!n8nWebhookUrl) {
          // Try other variations
          const possibleKeys = [
            'APP_CARD_N8N_WEBHOOK',
            'APPS_CARDS_N8N_WEBHOOK',
            'APP_CARDS_N8N_WEBHOOK'
          ];
          
          for (const key of possibleKeys) {
            if (process.env[key]) {
              n8nWebhookUrl = process.env[key];
              webhookKey = key;
              console.log(`Found apps card webhook: ${webhookKey}`);
              break;
            }
          }
        }
      }
      
      // For mood-genre, try with FINISHES suffix if not found
      if (!n8nWebhookUrl && categoryKey === 'mood_genre') {
        webhookKey = `${categoryKey}_FINISHES_N8N_WEBHOOK`.toUpperCase();
        n8nWebhookUrl = process.env[webhookKey];
        console.log(`Trying with FINISHES suffix: ${webhookKey}`);
      }
      
      // If still not found, use default
      if (!n8nWebhookUrl) {
        console.log(`Webhook URL not found for category: ${category}, item: ${item}, using default webhook`);
        n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
        webhookKey = 'DEFAULT_N8N_WEBHOOK';
      } else {
        console.log(`Using specific webhook for category ${category}, item ${item}: ${webhookKey}`);
      }
    } else {
      // Use default webhook if no cardId or category provided
      n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
      webhookKey = 'DEFAULT_N8N_WEBHOOK';
    }
    
    if (!n8nWebhookUrl) {
      return res.status(500).json({ 
        status: 'fail',
        error: 'N8N webhook URL is not configured' 
      });
    }
    
    // Validate webhook URL format
    try {
      new URL(n8nWebhookUrl);
    } catch (e) {
      console.error('Invalid N8N webhook URL format:', n8nWebhookUrl);
      return res.status(500).json({ 
        status: 'fail',
        error: 'Invalid N8N webhook URL format' 
      });
    }

    // Prepare webhook payload
    // Clean image_url from backticks if present
    const cleanedImageUrl = typeof image_url === 'string' ? image_url.replace(/`/g, '').trim() : image_url;
    
    // Log the final webhook being used
    console.log(`Using webhook URL: ${n8nWebhookUrl} (${webhookKey})`);
    
    const webhookPayload = {
      prompt,
      image_url: cleanedImageUrl,
      cardId: cardId || null,
      category: category || null,
      item: item || null,
      webhookType: cardId ? 'card' : (category && item ? 'category' : 'custom'),
      userId: req.user.id,
      userEmail: user.email,
      recordInfo: {
        id: `img_${Date.now()}`,
        type: 'image',
        source: 'fashionx',
        userId: req.user.id,
        userName: user.name,
        userEmail: user.email,
        category: category || null,
        item: item || null,
        source: cardId || `${category}-${item}`
      }
    };
    
    // Send request to n8n webhook
    // Clean webhook URL from backticks if present
    const cleanedWebhookUrl = typeof n8nWebhookUrl === 'string' ? n8nWebhookUrl.replace(/`/g, '').trim() : n8nWebhookUrl;
    
    console.log(`Sending request to n8n webhook: ${cleanedWebhookUrl}`);
    console.log('Request payload:', webhookPayload);
    
    // Add recordInfo to payload to fix 422 error
    webhookPayload.recordInfo = {
      id: `img_${Date.now()}`,
      type: 'image',
      source: webhookPayload.cardId || `${webhookPayload.category}-${webhookPayload.item}`
    };
    
    const response = await axios.post(cleanedWebhookUrl, webhookPayload, {
      timeout: 120000, // wait up to 120 seconds for n8n response
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('N8N webhook response status:', response.status);
    console.log('N8N webhook response headers:', response.headers);

    // Log the response data for debugging
    console.log('N8N webhook response data:', JSON.stringify(response.data, null, 2));
    
    // Check if response data is valid
    if (!response.data) {
      console.error('Empty response from N8N webhook');
      return res.status(502).json({
        status: 'fail',
        error: 'Empty response from N8N webhook'
      });
    }
    
    // Format the response for frontend
    // Make sure resultJson is properly formatted
    let formattedData = response.data;
    
    // If resultJson is a string, try to parse it
    if (formattedData.resultJson && typeof formattedData.resultJson === 'string') {
      try {
        // Remove any backticks that might be in the string
        const cleanJson = formattedData.resultJson.replace(/`/g, '');
        formattedData.resultJson = JSON.parse(cleanJson);
      } catch (e) {
        console.error('Error parsing resultJson:', e);
        // Keep it as string if parsing fails
      }
    }
    
    // Check if we have resultUrls in the response
    if (formattedData.resultJson && formattedData.resultJson.resultUrls && 
        Array.isArray(formattedData.resultJson.resultUrls) && 
        formattedData.resultJson.resultUrls.length > 0) {
      
      // Clean up URLs (remove backticks, trim spaces)
      formattedData.resultJson.resultUrls = formattedData.resultJson.resultUrls.map(url => 
        url.replace(/`/g, '').trim()
      );
      
      console.log('Extracted result URLs:', formattedData.resultJson.resultUrls);
    } else if (formattedData.data && formattedData.data.resultJson) {
      // Handle the case where resultJson is a string in the data object
      try {
        // Check if resultJson is a string and contains resultUrls
        if (typeof formattedData.data.resultJson === 'string') {
          // Remove any backticks that might be in the string
          const cleanJson = formattedData.data.resultJson.replace(/`/g, '');
          const parsedJson = JSON.parse(cleanJson);
          
          if (parsedJson.resultUrls && Array.isArray(parsedJson.resultUrls) && parsedJson.resultUrls.length > 0) {
            // Clean up URLs (remove backticks, trim spaces)
            const cleanUrls = parsedJson.resultUrls.map(url => url.replace(/`/g, '').trim());
            formattedData.resultUrls = cleanUrls;
            console.log('Extracted result URLs from data.resultJson:', cleanUrls);
          }
        }
      } catch (e) {
        console.error('Error parsing resultJson from data object:', e);
      }
    } else {
      console.warn('No resultUrls found in the response');
    }
    
    // Prepare the response data
    const responseData = {
      status: 'success',
      data: formattedData
    };
    
    // If we extracted resultUrls separately, include them directly in the response
    if (formattedData.resultUrls && formattedData.resultUrls.length > 0) {
      responseData.data.resultUrls = formattedData.resultUrls;
    }
    
    // Deduct credit and update user stats
    // Only deduct 1 credit per image generation
    user.credits.balance -= 1;
    user.credits.totalUsed += 1;
    user.credits.imagesGenerated += 1;
    
    // Save generated image to user's database
    const resultUrl = formattedData.resultUrls && formattedData.resultUrls.length > 0 
      ? formattedData.resultUrls[0] 
      : (formattedData.resultJson && formattedData.resultJson.resultUrls && formattedData.resultJson.resultUrls.length > 0 
        ? formattedData.resultJson.resultUrls[0] 
        : null);
    
    // Only save to database if we have a valid result URL
    if (resultUrl && resultUrl !== 'No result URL found') {
      const imageData = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalUrl: image_url,
        resultUrl: resultUrl,
        prompt: prompt,
        taskId: formattedData.taskId || null,
        createdAt: new Date()
      };
      
      // Add to user's generated images array
      user.generatedImages.push(imageData);
      
      // Keep only last 50 images to prevent database bloat
      if (user.generatedImages.length > 50) {
        user.generatedImages = user.generatedImages.slice(-50);
      }
    }
     
     await user.save();
    
    console.log('Updated user credits:', {
      balance: user.credits.balance,
      totalUsed: user.credits.totalUsed,
      imagesGenerated: user.credits.imagesGenerated
    });
    
    // Add credit info to response
    responseData.credits = {
      remaining: user.credits.balance
    };
    
    // Return the formatted response
    return res.json(responseData);

  } catch (err) {
    console.error('Error communicating with n8n webhook:', err.message);
    console.error('Full error details:', err.response?.data || 'No response data');
    
    // Check if it's a timeout error
    if (err.code === 'ECONNABORTED') {
      console.error('N8N webhook request timed out');
      return res.status(504).json({
        status: 'fail',
        error: 'N8N webhook request timed out. The image processing is taking too long.'
      });
    }
    
    // Check if it's a connection error
    if (err.code === 'ECONNREFUSED') {
      console.error('N8N webhook connection refused');
      return res.status(502).json({
        status: 'fail',
        error: 'N8N webhook connection refused. The service might be down.'
      });
    }
    
    // Handle 404 errors specifically for n8n webhook
    if (err.response?.status === 404) {
      console.error('N8N webhook not found (404):', err.response?.data);
      return res.status(502).json({
        status: 'fail',
        error: 'Image processing service is currently unavailable. Please try again later or contact support.',
        hint: 'The n8n workflow may need to be activated. Please ensure the workflow is running.'
      });
    }
    
    // Provide more detailed error message
    const errorMessage = err.response?.data?.error || 
                         err.response?.statusText || 
                         err.message || 
                         'Failed to process image';
    
    const statusCode = err.response?.status || 500;
    
    return res.status(statusCode).json({ 
      status: 'fail',
      error: errorMessage,
      details: err.response?.data || null 
    });
  }
};