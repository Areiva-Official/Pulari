import { Users, Heart, Leaf, Trophy } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen pt-24">
      <section
        className="relative h-96 flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-6xl font-bold mb-4 animate-fade-in">Our Story</h1>
          <p className="text-2xl animate-fade-in-delay">A culinary journey in the heart of Dublin</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 leading-relaxed mb-6 animate-slide-in-left">
              Nestled in the vibrant heart of Dublin city centre on Temple Street, Pulari Restaurant 
              opened its doors in 2025 with a vision to bring the authentic flavors of South Indian 
              and Kerala cuisine to Ireland. Founded by Mr. Bijukuttan, a passionate culinary visionary 
              with deep roots in traditional Kerala cooking, Pulari represents more than just a restaurant—it's 
              a bridge between two cultures, a celebration of heritage, and a warm embrace of Irish hospitality.
            </p>
            <p className="text-xl text-gray-700 leading-relaxed mb-6 animate-slide-in-right">
              The name "Pulari" evokes the first light of dawn in Malayalam, symbolizing new beginnings 
              and the awakening of flavors. Mr. Bijukuttan's journey from the spice-laden kitchens of 
              Kerala to Dublin's bustling streets is one of dedication and passion. Having mastered the 
              art of traditional Kerala cooking from generations of family recipes, he brings authentic 
              techniques and rare spice blends that transport diners straight to the backwaters of Kerala.
            </p>
            <p className="text-xl text-gray-700 leading-relaxed mb-6 animate-slide-in-left">
              Our menu is a carefully curated collection of South Indian delicacies—from crispy dosas 
              and fluffy appams to aromatic biryanis and rich curries. Every dish tells a story, prepared 
              with premium ingredients and the same love that goes into a home-cooked meal. We source 
              authentic spices and ingredients while incorporating the finest Irish produce, creating a 
              unique fusion that honors both traditions.
            </p>
            <p className="text-xl text-gray-700 leading-relaxed animate-slide-in-right">
              Open six days a week from 12 PM to 9 PM (closed Tuesdays), Pulari has quickly become a 
              beloved destination for both the Indian community seeking a taste of home and Irish locals 
              discovering the rich tapestry of South Indian cuisine. Whether you're joining us for lunch 
              or dinner, our doors welcome you to experience the warmth, flavor, and hospitality that 
              define Pulari Restaurant.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Heart size={48} />,
                title: 'Authenticity',
                description: 'Traditional Kerala recipes passed down through generations',
              },
              {
                icon: <Leaf size={48} />,
                title: 'Quality',
                description: 'Premium spices and fresh ingredients in every dish',
              },
              {
                icon: <Users size={48} />,
                title: 'Community',
                description: 'A warm gathering place for families and friends',
              },
              {
                icon: <Trophy size={48} />,
                title: 'Hospitality',
                description: 'Exceptional service with a personal touch, day and night',
              },
            ].map((value, index) => (
              <div
                key={index}
                className="text-center p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-amber-600 flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-800">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Our Team section removed */}
    </div>
  );
}
