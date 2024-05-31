const express = require("express")
const { SimpleDirectoryReader } = require("llamaindex/readers/SimpleDirectoryReader")
const { SentenceSplitter } = require("llamaindex")
const { Gemini, GeminiEmbedding, Settings, serviceContextFromDefaults } = require("llamaindex")
const { Document, VectorStoreIndex, QdrantVectorStore } = require("llamaindex")
const app = express()
const dotenv = require("dotenv")
const port = process.env.PORT_WEB || 8000;
app.use(express.json())
app.set("view engine", "ejs")


dotenv.config({path: './.env'});
const splitter = new SentenceSplitter({ chunkSize: 70, chunkOverlap: 20 })
const embed = new GeminiEmbedding()
Settings.embedModel = embed
const gemini = new Gemini()
const service = serviceContextFromDefaults({
  llm: gemini,
  embedModel: embed,
})
// Settings.embedModel = new GeminiEmbedding()
// const vectorStore = new QdrantVectorStore({
//   url: "http://localhost:6333",
// });
/*Ingestion*/
//PDF Reader
async function loadDoc(){
  const reader = new SimpleDirectoryReader()
  const document = await reader.loadData('../SS2_Project/doccument')
  return document
}
//Text splitter
async function text_splitter(){
  const splitresult = []
  const document = await loadDoc()
  document.forEach((doc) => {
    if(doc.getText() !== ''){
      const textsplitter = splitter.splitText(doc.getText())
      textsplitter.forEach((text) => {
        splitresult.push(text)
      })
    }
  })
  return splitresult
}
//Add document to Vector Database
async function answer(){
  const doclist= []
  let i = 0
  const document = await text_splitter()
  document.forEach((doc) => {
    const docjson = new Document({ text: doc, id_: "doc" + i.toString})
    doclist.push(docjson)
    i++
  })
  const index = await VectorStoreIndex.fromDocuments(doclist, {
    serviceContext: service,
  })
  const queryEngine = index.asQueryEngine() 
  const query = "What is CNN Model?"
  const results = await queryEngine.query({
    query,
  })
  return results
}
/*Retrieval*/
//VectorSearch
// async function queryEngine(){
//   const index = await VectorSave()
//   const queryEngine = index.asQueryEngine()
//   return queryEngine
// }

// async function answer(){
//   const index = await VectorSave()
//   const queryEngine = index.asQueryEngine({
//     service
//   }) 
//   const query = "What is CNN Model?"
//   const results = await queryEngine.query({
//     query,
//   })
//   return results
// }
answer()
app.get("/",async (req, res) => {
  const traloi = await answer()
  console.log(traloi)
  res.render("mainpage.ejs")
})

app.listen(port, () => {
  console.log(`Email system app listening at http://localhost:${port}`);
})
