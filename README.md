to start running the application

open a terminal and do
cd frontend
npm install
npm run dev

open a second terminal and do 
cd backend
create a virtual env using:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn api:app --reload