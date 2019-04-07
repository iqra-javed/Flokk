const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
/*
buildSchema: function that takes a JS template literal string
(which we can then use to define our schema) as a 
parameter and then converts it to graphql schema object 
*/
const { buildSchema }  = require('graphql'); 

const app = express();

// Middleware
app.use(bodyParser.json());
//express-graphql: Used as  a middleware. 
// Takes incoming requests and funnels
// them through the graphql query parser, and then
// handles them according to the schema and then
// forwards them to the right resolver
app.use('/graphql', graphqlHttp({
        schema: buildSchema(`
        type RootQuery {
            events: [String!]! 
            # 1st ! means it will always return an array containing string values and no nulls
            # & 2nd ! means it will always return an array and not just null
        }

        type RootMutation {
            createEvent(name: String): String
            # takes a string as parameter and will return or echo the name of the Event that was created
        }

            schema {
                query: RootQuery
                mutation: RootMutation
            }
        `), // backticks allow writing multy-lined strings
        rootValue: { // bundle of all resolvers
            // Resolver names have to match up to the queries / mutation names created above
            events: () => {
                return ['Intro to Sewing', 'Sailing', 'All-Night Coding'];
            }, // this function will be called when an incoming request requests the events.
            createEvent: (args) => {
                const eventName = args.name;
                return eventName;
            }
        },
        graphiql: true
}))

app.listen(4000);
