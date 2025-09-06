-- Ensure required globals exist
if not ao then error("ao is not defined") end
if not Handlers then error("Handlers is not defined") end
if not Handlers.add then error("Handlers.add is not defined") end
if not Handlers.utils then error("Handlers.utils is not defined") end
if not Handlers.utils.hasMatchingTag then error("Handlers.utils.hasMatchingTag is not defined") end

-- Load JSON module
local json = require("json")
if not json then error("Failed to load json module") end

-- Initialize test number
TestNumber = 0

-- Initialize colors table
Colors = {}

-- Initialize 100x100 array
for i = 1, 100 do
  Colors[i] = {}
  for j = 1, 100 do
    Colors[i][j] = {0, 0, 0} -- Initialize with black color
  end
end

-- Function to validate color values
local function isValidColor(color)
  if type(color) ~= "table" or #color ~= 3 then
    return false
  end
  for _, value in ipairs(color) do
    if type(value) ~= "number" or value < 0 or value > 255 or math.floor(value) ~= value then
      return false
    end
  end
  return true
end

-- Function to patch the current state
local function patch()
  -- Generate a random test number between 1 and 1000
  TestNumber = math.random(1, 1000)
  
  -- Send patch
  local success, err = pcall(function()
    ao.send({ 
      device = "patch@1.0", 
      state = {
        testNumber = TestNumber,
        pixels = Colors
      }
    })
  end)
  
  if not success then
    print("Failed to send patch: " .. tostring(err))
  end
end

-- Handler for changing pixel colors
local success, err = pcall(function()
  Handlers.add(
    "changePixel",
    Handlers.utils.hasMatchingTag("Action", "changePixel"),
    function (msg)
      -- Ensure msg exists
      if not msg then 
        print("Message is nil")
        return 
      end
      
      -- Ensure Data exists
      if not msg.Data then
        print("No data provided")
        return
      end

      -- Safely decode JSON
      local success, data = pcall(json.decode, msg.Data)
      if not success or not data then
        print("Failed to decode JSON data")
        return
      end

      -- Validate required fields
      if not data.x or not data.y or not data.color then
        print("Missing required fields (x, y, or color)")
        return
      end
      
      -- Convert coordinates to numbers
      local x = tonumber(data.x)
      local y = tonumber(data.y)
      
      -- Validate coordinates and color
      if not x or not y or x < 1 or x > 100 or y < 1 or y > 100 then
        print("Invalid coordinates (must be between 1 and 100)")
        return
      end

      if not isValidColor(data.color) then
        print("Invalid color values (must be integers 0-255)")
        return
      end

      -- Update color
      Colors[x][y] = data.color
      print(string.format("Pixel changed at %d,%d to [%d,%d,%d]", 
        x, y, data.color[1], data.color[2], data.color[3]))
      
      -- Patch the new state
      patch()
    end
  )
end)

if not success then
  print("Failed to add handler: " .. tostring(err))
end

-- Seed the random number generator
math.randomseed(os.time())

-- Initial patch to set starting state
patch()
