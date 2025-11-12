const fs = require("fs")
const path = require("path")
const {
  generateJazzyInstallCommand,
  generateJazzyArguments,
  sliceDocumentsFromJazzyArgs,
  getDocumentationFolder
} = require("./main")

describe("generateJazzyInstallCommand", () => {
  test("should generate default install command without version", () => {
    const result = generateJazzyInstallCommand()
    expect(result).toBe("sudo gem install jazzy")
  })

  test("should generate install command with version", () => {
    const result = generateJazzyInstallCommand("0.14.0")
    expect(result).toBe("sudo gem install jazzy -v 0.14.0")
  })
})

describe("generateJazzyArguments", () => {
  test("should generate default jazzy command", () => {
    const result = generateJazzyArguments()
    expect(result).toBe("jazzy")
  })

  test("should generate jazzy command with args", () => {
    const result = generateJazzyArguments("--theme fullwidth")
    expect(result).toBe("jazzy --theme fullwidth")
  })

  test("should generate jazzy command with config", () => {
    const result = generateJazzyArguments(null, ".jazzy.yml")
    expect(result).toBe("jazzy --config .jazzy.yml")
  })

  test("should generate jazzy command with both args and config", () => {
    const result = generateJazzyArguments("--theme fullwidth", ".jazzy.yml")
    expect(result).toBe("jazzy --theme fullwidth --config .jazzy.yml")
  })
})

describe("sliceDocumentsFromJazzyArgs", () => {
  test("should extract output directory from middle of args", () => {
    const jazzyArgs = "--theme fullwidth --output custom-docs --author Test"
    const result = sliceDocumentsFromJazzyArgs(jazzyArgs, "--output")
    expect(result).toBe("custom-docs")
  })

  test("should extract output directory from end of args", () => {
    const jazzyArgs = "--theme fullwidth --output custom-docs"
    const result = sliceDocumentsFromJazzyArgs(jazzyArgs, "--output")
    expect(result).toBe("custom-docs")
  })

  test("should extract output directory with -o flag", () => {
    const jazzyArgs = "-o my-docs --theme fullwidth"
    const result = sliceDocumentsFromJazzyArgs(jazzyArgs, "-o")
    expect(result).toBe("my-docs")
  })
})

describe("getDocumentationFolder", () => {
  const testConfigDir = path.join(__dirname, "test-configs")

  beforeAll(() => {
    // Create test config files
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir)
    }
  })

  afterAll(() => {
    // Clean up test config files
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true })
    }
  })

  test("should return default docs folder when no args or config", () => {
    const result = getDocumentationFolder()
    expect(result).toBe("docs")
  })

  test("should extract folder from --output arg", () => {
    const result = getDocumentationFolder("--output api-docs --theme fullwidth")
    expect(result).toBe("api-docs")
  })

  test("should extract folder from -o arg", () => {
    const result = getDocumentationFolder("-o my-api-docs")
    expect(result).toBe("my-api-docs")
  })

  test("should prioritize --output over -o", () => {
    const result = getDocumentationFolder("--output correct-docs -o wrong-docs")
    expect(result).toBe("correct-docs")
  })

  test("should read output from YAML config file", () => {
    const yamlConfigPath = path.join(testConfigDir, "test.yml")
    fs.writeFileSync(yamlConfigPath, "output: yaml-docs\nauthor: Test Author")
    
    const result = getDocumentationFolder(null, yamlConfigPath)
    expect(result).toBe("yaml-docs")
  })

  test("should read output from JSON config file", () => {
    const jsonConfigPath = path.join(testConfigDir, "test.json")
    fs.writeFileSync(jsonConfigPath, JSON.stringify({ output: "json-docs", author: "Test Author" }))
    
    const result = getDocumentationFolder(null, jsonConfigPath)
    expect(result).toBe("json-docs")
  })

  test("should prioritize args over config file", () => {
    const yamlConfigPath = path.join(testConfigDir, "priority-test.yml")
    fs.writeFileSync(yamlConfigPath, "output: config-docs")
    
    const result = getDocumentationFolder("--output arg-docs", yamlConfigPath)
    expect(result).toBe("arg-docs")
  })

  test("should return default when config has no output field", () => {
    const yamlConfigPath = path.join(testConfigDir, "no-output.yml")
    fs.writeFileSync(yamlConfigPath, "author: Test Author\ntheme: fullwidth")
    
    const result = getDocumentationFolder(null, yamlConfigPath)
    expect(result).toBe("docs")
  })
})
