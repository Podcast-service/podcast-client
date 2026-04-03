import Logo from './components/Logo/Logo';
import Footer from './components/Footer/Footer';
import LoginPage from './pages/LoginPage/LoginPage';
import './styles/global.css';

function App() {
    return (
        <div className="app">
            <Logo />
            <LoginPage />
            <Footer />
        </div>
    );
}

export default App;