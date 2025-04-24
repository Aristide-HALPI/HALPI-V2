import { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Mail, Phone, Send } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const SupportPage = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Données temporaires pour la FAQ
  const faqItems: FAQItem[] = [
    {
      question: 'Comment fonctionne la planification AI de HALPI ?',
      answer: 'HALPI utilise un algorithme d\'intelligence artificielle pour analyser votre niveau, vos objectifs et votre disponibilité afin de créer un plan d\'apprentissage personnalisé. Le système s\'adapte en fonction de votre progression et ajuste votre parcours en conséquence.',
      category: 'Général'
    },
    {
      question: 'Puis-je accéder à HALPI sur mobile ?',
      answer: 'Oui, HALPI est entièrement responsive et fonctionne sur tous les appareils : ordinateurs, tablettes et smartphones. Vous pouvez ainsi apprendre où que vous soyez.',
      category: 'Général'
    },
    {
      question: 'Comment modifier mon mot de passe ?',
      answer: 'Pour modifier votre mot de passe, rendez-vous dans votre profil en cliquant sur votre avatar en haut à droite, puis allez dans l\'onglet "Paramètres". Vous pourrez y modifier votre mot de passe ainsi que d\'autres informations personnelles.',
      category: 'Compte'
    },
    {
      question: 'Comment supprimer mon compte ?',
      answer: 'Pour supprimer votre compte, rendez-vous dans votre profil, onglet "Paramètres", puis faites défiler jusqu\'à la section "Danger zone". Cliquez sur "Supprimer mon compte" et suivez les instructions. Attention, cette action est irréversible.',
      category: 'Compte'
    },
    {
      question: 'Les cours sont-ils accessibles hors ligne ?',
      answer: 'Actuellement, les cours nécessitent une connexion internet pour être consultés. Cependant, nous travaillons sur une fonctionnalité qui permettra de télécharger certains contenus pour un accès hors ligne.',
      category: 'Cours'
    },
    {
      question: 'Comment obtenir un certificat de fin de cours ?',
      answer: 'Une fois que vous avez terminé toutes les activités d\'un cours et réussi l\'examen final, vous recevrez automatiquement un certificat de réussite. Vous pourrez le télécharger depuis votre profil dans la section "Mes certificats".',
      category: 'Cours'
    },
    {
      question: 'Comment réserver une session de coaching ?',
      answer: 'Pour réserver une session de coaching, rendez-vous dans la section "Accompagnement", choisissez un coach disponible et cliquez sur "Prendre rendez-vous". Vous pourrez ensuite sélectionner une date et une heure qui vous conviennent.',
      category: 'Coaching'
    },
    {
      question: 'Puis-je annuler une session de coaching ?',
      answer: 'Oui, vous pouvez annuler une session de coaching jusqu\'à 24 heures avant l\'heure prévue sans frais. Pour ce faire, rendez-vous dans la section "Accompagnement", onglet "Mes sessions", et cliquez sur "Annuler" à côté de la session concernée.',
      category: 'Coaching'
    }
  ];
  
  // Catégories uniques pour la FAQ
  const categories = Array.from(new Set(faqItems.map(item => item.category)));
  
  const toggleCategory = (category: string) => {
    setActiveCategory(activeCategory === category ? null : category);
  };
  
  const toggleQuestion = (question: string) => {
    setExpandedQuestions(prev => 
      prev.includes(question) 
        ? prev.filter(q => q !== question) 
        : [...prev, question]
    );
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setFormError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // Simulation d'envoi de formulaire
    setFormError(null);
    setFormSubmitted(true);
    
    // Dans une implémentation réelle, nous enverrions les données à l'API
    console.log('Form submitted:', contactForm);
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Support</h1>
        <p className="text-gray-600">Trouvez des réponses à vos questions ou contactez-nous</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQ Section */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="h-5 w-5 text-primary-600" />
              <h2 className="text-xl font-medium text-gray-900">Foire aux questions</h2>
            </div>
            
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => toggleCategory(category)}
                  >
                    <h3 className="text-lg font-medium text-gray-900">{category}</h3>
                    {activeCategory === category ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  
                  {activeCategory === category && (
                    <div className="divide-y divide-gray-200">
                      {faqItems
                        .filter(item => item.category === category)
                        .map((item, index) => (
                          <div key={index} className="bg-white">
                            <button
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                              onClick={() => toggleQuestion(item.question)}
                            >
                              <h4 className="font-medium text-gray-900">{item.question}</h4>
                              {expandedQuestions.includes(item.question) ? (
                                <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              )}
                            </button>
                            
                            {expandedQuestions.includes(item.question) && (
                              <div className="p-4 pt-0 text-gray-600">
                                {item.answer}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        {/* Contact Form */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="h-5 w-5 text-primary-600" />
              <h2 className="text-xl font-medium text-gray-900">Nous contacter</h2>
            </div>
            
            {formSubmitted ? (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100">
                  <Send className="h-6 w-6 text-success-600" />
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">Message envoyé</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.
                </p>
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFormSubmitted(false);
                      setContactForm({
                        name: '',
                        email: '',
                        subject: '',
                        message: ''
                      });
                    }}
                  >
                    Envoyer un autre message
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="bg-error-50 border border-error-200 text-error-700 p-3 rounded-md text-sm">
                    {formError}
                  </div>
                )}
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-error-500">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleInputChange}
                    fullWidth
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-error-500">*</span>
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={contactForm.email}
                    onChange={handleInputChange}
                    fullWidth
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Sujet
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleInputChange}
                    fullWidth
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-error-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={contactForm.message}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                
                <Button type="submit" variant="default" fullWidth>
                  Envoyer
                </Button>
              </form>
            )}
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Autres moyens de contact</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 p-2 rounded-full">
                    <Mail className="h-4 w-4 text-primary-600" />
                  </div>
                  <span className="text-sm text-gray-600">support@halpi.com</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 p-2 rounded-full">
                    <Phone className="h-4 w-4 text-primary-600" />
                  </div>
                  <span className="text-sm text-gray-600">+33 1 23 45 67 89</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
