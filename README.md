Academic World Data Intelligence Dashboard

TITLE
Academic World Data Intelligence Dashboard

PURPOSE
The Academic World Data Intelligence Dashboard is a full-stack academic analytics platform designed to help users explore research activity across universities, faculty members, publications, and research keywords using live database queries and interactive dashboard widgets.

The application targets:
- Students
- Researchers
- Academic analysts
- University administrators

The objectives of the application are to:
- Visualize academic publication trends
- Analyze research keyword popularity
- Explore faculty research impact
- Compare citation metrics
- Demonstrate the integration of relational and NoSQL databases in a unified dashboard system

The project uses the Academic World dataset and integrates MySQL and MongoDB to support different analytical use cases.


INSTALLATION

Prerequisites:
- Node.js
- PNPM
- MySQL
- MongoDB

Clone Repository:
git clone <repository-link>
cd academic-world-dashboard

Install Dependencies:
pnpm install --force

Start Backend:
cd artifacts/api-server
set -a
source .env
set +a
NODE_ENV=development pnpm run build && pnpm run start

Start Frontend:
cd artifacts/dashboard
pnpm run dev

Open Browser:
http://localhost:5173

USAGE
Users can interact with the dashboard through multiple widgets and analytical views.

Main capabilities include:
- Searching research keywords
- Viewing publication trends over time
- Exploring faculty H-index rankings
- Viewing venue citation impact
- Searching faculty members
- Exploring MongoDB publication analytics
- Viewing keyword co-occurrence
- Saving favorite keywords

DESIGN
The application follows a multi-tier dashboard architecture.

Frontend:
- React
- Vite
- TailwindCSS
- Recharts visualization library

Backend:
- Node.js
- Express REST API

Databases:
- MySQL
- MongoDB

IMPLEMENTATION
The application was implemented using a modular full-stack architecture.

The dashboard interface was developed using reusable React components styled with TailwindCSS. Recharts was used for charts and visualization components.

REST API endpoints were created to support:
- MySQL analytics queries
- MongoDB aggregation queries
- Keyword search
- Faculty search
- Publication trend analysis

DATABASE TECHNIQUES

MySQL Techniques:
- JOIN + GROUP BY
- GROUP BY + WHERE
- ROW_NUMBER() Window Function + CTE
- Correlated Subqueries

MongoDB Techniques:
- Aggregation Pipeline
- $group + $sort + $project
- Regex Text Search

CONTRIBUTIONS
Raphael Popoola completed:
- Dashboard frontend development
- Backend API implementation
- MySQL database loading
- MongoDB database loading
- REST API integration
- Dashboard widget implementation
- SQL analytical query development
- MongoDB aggregation implementation
- Testing and debugging
- GitHub repository management
- README preparation
- Deployment troubleshooting

Estimated contribution:
100%
