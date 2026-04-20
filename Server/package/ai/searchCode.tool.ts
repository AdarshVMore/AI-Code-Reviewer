import { searchRelevantEmbeddings } from "../../app/worker-service/services/rag.service.js";

async function searchFile() {

}


// Some Steps to Chunk =>
//  Get Repo zip => Unzip => get Folder structure some how
//  create a Tree of that folder structure => take one branch => Read all Code Files in it => create Functions / Classes + Imports + Variables + etc as Nodes
//  we can create such Tree by telling LLM to create and then we Store it in a DB [ will do this for now => Big Context Window with Many Tokens used]
//  Based on that Tres and Branches and Nodes => find Functions / Classes / Files and Chunk those and embed and Store in Vectore DB
//  
//
//
//
//
//
//
//
//
//