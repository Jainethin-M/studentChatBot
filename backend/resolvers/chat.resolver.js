import  { askQuestion } from "./testStCht.js";

const chatResolver = {
    Mutation: {
        getChat : async (_,{input}) => {
            
            try {
                // console.log('input --->',input)
                const res = await askQuestion(input.message,input.stid);
                // console.log('res --->',res)
                return res;
                
            } catch (error) {
                console.log('error in chatResolver - getChat',error)
                return error;
            }
        }
    },
}

export default chatResolver;