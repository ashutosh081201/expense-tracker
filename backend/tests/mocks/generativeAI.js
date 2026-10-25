// Stand-in for @google/generative-ai. Tests drive the model's
// response through `generateContent`.
const generateContent = jest.fn();
const getGenerativeModel = jest.fn(() => ({ generateContent }));

class GoogleGenerativeAI {
  getGenerativeModel(...args) {
    return getGenerativeModel(...args);
  }
}

module.exports = { GoogleGenerativeAI, generateContent, getGenerativeModel };
