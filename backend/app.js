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

const events = [];

// Middleware
app.use(bodyParser.json());
//express-graphql: Used as  a middleware. 
// Takes incoming requests and funnels
// them through the graphql query parser, and then
// handles them according to the schema and then
// forwards them to the right resolver
app.use('/graphql', graphqlHttp({
        schema: buildSchema(`
        type Event {
            _id: ID!
                #ID is a special data type, ! makes id non-nullable / required
            title: String!
            description: String!
            price: Float!
            date: String!
                # there is no data type in graphQL
        }

        input EventInput {
            # input is a special type that is similar to args in JS. 
            # It will be an array of arguments to create an Event in this case
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type RootQuery {
            events: [Event!]! 
                # 1st ! means it will always return an array containing Event objects and no nulls, or strings etc
                # & 2nd ! means it will always return an array. It may be an empty array but not null
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
                # takes a string as parameter and will return or echo the Event that was created
        }

            schema {
                query: RootQuery
                mutation: RootMutation
            }
        `), // backticks allow writing multy-lined strings
        rootValue: { // bundle of all resolvers
            // Resolver names have to match up to the queries / mutation names created above
            events: () => {
                return events;
            }, // this function will be called when an incoming request requests the events.
            createEvent: (args) => {
                const { eventInput } = args;
                const event = {
                    _id: Math.random().toString(),
                    title: eventInput.title,
                    description: eventInput.description, 
                    price: +eventInput.price, //+ to convert arg to number if it wasnt already
                    date: eventInput.date
                }
                events.push(event);
                return event;
            }
        },
        graphiql: true
}))

app.listen(4000);
