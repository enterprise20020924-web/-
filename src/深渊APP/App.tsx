/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Layout from './components/Layout';
import HomeView from './views/HomeView';
import ContactsView from './views/ContactsView';
import DiscoveryView from './views/DiscoveryView';
import ProfileView from './views/ProfileView';
import Toast from './components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
  };

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView showToast={showToast} />;
      case 'contacts':
        return <ContactsView showToast={showToast} />;
      case 'discovery':
        return <DiscoveryView showToast={showToast} />;
      case 'profile':
        return <ProfileView showToast={showToast} />;
      default:
        return <HomeView showToast={showToast} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderView()}
      <Toast 
        message={toastMessage} 
        isVisible={isToastVisible} 
        onClose={() => setIsToastVisible(false)} 
      />
    </Layout>
  );
}
