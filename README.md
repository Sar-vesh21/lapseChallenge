# Backend Tech Test: Social Media Feed API Challenge

## Overview
You are building a new social media application's backend service. At the core of your product is a feed API that powers both web and mobile clients. Your task is to design and implement a high-performance backend service that can efficiently serve social media feed content while meeting strict performance requirements.

## Project Structure
The project is split into 3 parts:

### Part 1: Research & Documentation
Spend some time researching and documenting your technology choices for building a performant feed API. Consider and document:
- Choice of database technology and schema design
- API protocol selection and rationale
- Caching strategies
- Performance optimization approaches
- Trade-offs between different solutions
- Scalability considerations

### Part 2: Feed API Implementation
Design and implement a feed API service. The requirements can be found below. We require you to use Node.js and Typescript for the API server. We use this regularly on the day to day so it's important you are comfortable using this for your test

#### Core Requirements:
- Implement the provided API endpoints
- Design and implement an efficient database schema
- Persist data in a suitable data store (e.g., PostgreSQL, DynamoDB, Redis)
- Support pagination with cursor-based navigation
- Ensure no duplicate content is shown to users if it is marked as seen
- Implement caching for improved performance where possible
- Achieve sub-100ms response times for local requests per page

#### Logic: 
- For a piece of media to be visible on the feed, it must have at least one piece of engagement (e.g. A comment).
- Once a piece of media is marked as seen, it should no longer be served to the user. Once all media has been seen, content can be resurfaced.
- Feed content is predictable, and should be ranked by one or more factors. The details of these are up to you. 

#### Seed data:
- We have provided a seed data set. You may find some incomplete connections or fields that are not populated, feel free to manipulate the data to meet the brief. 
- You can also add some endpoints to update this initial seed data if it helps you.

#### Technical Constraints:
- Must be implemented in Node.js and TypeScript
- Must provide a RESTful or GraphQL API (your choice)
- Must include proper error handling and logging
- Must include basic API documentation
- Must include basic test coverage

> Note: This can all be completed locally, feel free to provision all your infrastructure in docker. You do not need to deploy it. 

## API Requirements

### Core Endpoints
The following endpoints must be implemented:

1. Get Feed Items
```typescript
GET /api/feed

Query Parameters:
  - cursor: string (optional)
  - limit: number (optional, default: 20)

Response:
{
  items: Array<{
    id: string;
    type: string;
    content: object;
    timestamp: string;
  }>;
  next_cursor?: string;
}
```

2. Mark Item as Read
```typescript
POST /api/feed/items/:itemId/read

Request:
{
  timestamp: string; // ISO 8601
}

Response: 200 OK
```

### Part 3: Data loading and Integration
We provide the following resources to help you get started:
- A web frontend implementation for testing
- CSV data files containing:
  - Node data (users, posts, etc.)
  - Edge data (relationships between nodes)
  - Additional metadata

Using your solution from part 2. Your task will be to:
1. Load your data store with the data from the supplied CSVs 
2. Implement the required API endpoints
3. Integrate with the provided web frontend
4. Assess the performance of your solution against the points below
5. Document any findings and note any improvements you would make if you were to take the solution any further.

### Performance Requirements
- Sub-100ms response time for feed requests (95th percentile)
- Efficient pagination handling
- Proper caching where appropriate
- No duplicate content in feed results
- Graceful handling of high load

### Data Loading
To facilitate testing and evaluation, please include a data loading script that:
1. Takes the provided CSV data files (objects.csv and edges.csv)
2. Transforms them as needed for your chosen database solution
3. Loads them into your database

This will allow us to:
- Run your solution end-to-end locally
- Test with realistic data volumes
- Verify performance characteristics
- Evaluate your data modeling decisions

Your loading script should:
- Be well-documented
- Handle errors gracefully
- Include any necessary data transformations
- Support rerunning without duplicate data
- Be efficient for the data volume

## Getting Started
1. Clone this repository
2. Initialise Git repo, we would like to see your commit history during the submission
3. Install Node.js and TypeScript
4. Review the provided CSV data files
5. Design your database schema
6. Implement the required endpoints
7. Test with the provided web frontend

## Development Process
We value seeing your thought process and development approach. Please:

1. Make regular, focused commits with clear commit messages
2. Document your progress and decisions as you go
3. Include comments explaining complex logic or performance considerations
4. Write clear documentation for running and testing your solution

If you use AI tools or assistants, document how you used them and be prepared to:
- Explain and defend all technical decisions
- Demonstrate full understanding of the code
- Discuss alternative approaches considered
- Answer questions about performance optimizations

## Submission
Once you've completed the implementation:

1. Create a zip file of your entire project directory (including the .git folder to preserve commit history)
2. Name the zip file with your name and the date (e.g., "john_doe_backend_2024_03_20.zip")
3. Send the zip file back to us
4. Ensure your zip file includes:
   - Your research documentation
   - Implementation code
   - Database schema design
   - API documentation
   - Setup instructions
   - Performance metrics or benchmarks
   - Notes about development process or challenges encountered

Thank you and good luck! 