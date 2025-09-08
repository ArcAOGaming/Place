-- Ensure required globals exist
if not ao then error("ao is not defined") end
if not Handlers then error("Handlers is not defined") end
if not Handlers.add then error("Handlers.add is not defined") end
if not Handlers.utils then error("Handlers.utils is not defined") end
if not Handlers.utils.hasMatchingTag then error("Handlers.utils.hasMatchingTag is not defined") end

-- Load JSON module
local json = require("json")
if not json then error("Failed to load json module") end

-- Define dimensions
local WIDTH, HEIGHT = 10, 10

-- Initialize colors table as flat array of RGB triplets
Colors = {}
for i = 1, WIDTH * HEIGHT * 3 do
  Colors[i] = 0
end

-- Helper functions for pixel access
local function setPixel(x, y, color)
  -- x and y are already 1-based from frontend
  local index = ((y - 1) * WIDTH + (x - 1)) * 3 + 1
  Colors[index], Colors[index+1], Colors[index+2] =
    color[1], color[2], color[3]
end

local function getPixel(x, y)
  -- x and y are already 1-based from frontend
  local index = ((y - 1) * WIDTH + (x - 1)) * 3 + 1
  return { Colors[index], Colors[index+1], Colors[index+2] }
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

-- Function to validate coordinates
local function isValidCoordinate(x, y)
  return type(x) == "number" and type(y) == "number" and 
         x >= 1 and x <= WIDTH and y >= 1 and y <= HEIGHT
end

-- Patch: directly slice Colors into 2D pixel array
local function patch()
  local pixels = {}
  for y = 1, HEIGHT do
    local row = {}
    for x = 1, WIDTH do
      local index = ((y - 1) * WIDTH + (x - 1)) * 3 + 1
      row[x] = { Colors[index], Colors[index+1], Colors[index+2] }
    end
    pixels[y] = row
  end

  local success, err = pcall(function()
    ao.send({
      device = "patch@1.0",
      state = {
        pixels = pixels
      }
    })
  end)

  if not success then
    print("Failed to send patch: " .. tostring(err))
  end
end

-- Handler for changing multiple pixels at once
local success, err = pcall(function()
  Handlers.add(
    "changePixels",
    Handlers.utils.hasMatchingTag("Action", "changePixels"),
    function (msg)
      if not msg or not msg.Data then
        print("No data provided")
        return
      end

      local success, data = pcall(json.decode, msg.Data)
      if not success or not data or not data.pixels then
        print("Failed to decode JSON data or missing pixels array")
        return
      end

      -- Validate and apply all pixel changes
      local validChanges = true
      for _, pixel in ipairs(data.pixels) do
        if not pixel.x or not pixel.y or not pixel.color then
          print("Invalid pixel data: missing x, y, or color")
          validChanges = false
          break
        end

        -- Convert from 0-based to 1-based indexing
        local x = tonumber(pixel.x) + 1
        local y = tonumber(pixel.y) + 1

        if not isValidCoordinate(x, y) then
          print(string.format("Invalid coordinates (%d,%d)", x-1, y-1))
          validChanges = false
          break
        end

        if not isValidColor(pixel.color) then
          print("Invalid color values")
          validChanges = false
          break
        end
      end

      -- Only apply changes if all pixels are valid
      if validChanges then
        for _, pixel in ipairs(data.pixels) do
          -- Convert from 0-based to 1-based indexing
          local x = tonumber(pixel.x) + 1
          local y = tonumber(pixel.y) + 1
          setPixel(x, y, pixel.color)
          print(string.format("Pixel changed at %d,%d to [%d,%d,%d]", 
            x-1, y-1, pixel.color[1], pixel.color[2], pixel.color[3]))
        end
        patch()
      end
    end
  )
end)

if not success then
  print("Failed to add changePixels handler: " .. tostring(err))
end

-- Handler for changing single pixel (original functionality)
local success, err = pcall(function()
  Handlers.add(
    "changePixel",
    Handlers.utils.hasMatchingTag("Action", "changePixel"),
    function (msg)
      if not msg or not msg.Data then
        print("No data provided")
        return
      end

      local success, data = pcall(json.decode, msg.Data)
      if not success or not data then
        print("Failed to decode JSON data")
        return
      end

      if not data.x or not data.y or not data.color then
        print("Missing required fields (x, y, or color)")
        return
      end
      
      -- Convert from 0-based to 1-based indexing
      local x = tonumber(data.x) + 1
      local y = tonumber(data.y) + 1
      
      if not isValidCoordinate(x, y) then
        print(string.format("Invalid coordinates (%d,%d)", x-1, y-1))
        return
      end

      if not isValidColor(data.color) then
        print("Invalid color values (must be integers 0-255)")
        return
      end

      setPixel(x, y, data.color)
      print(string.format("Pixel changed at %d,%d to [%d,%d,%d]", 
        x-1, y-1, data.color[1], data.color[2], data.color[3]))
      
      patch()
    end
  )
end)

if not success then
  print("Failed to add changePixel handler: " .. tostring(err))
end

-- Initial patch to set starting state
patch()
