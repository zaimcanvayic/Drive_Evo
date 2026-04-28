'use client';
import { motion } from 'framer-motion';
import { FaCar, FaChartLine, FaRoad } from 'react-icons/fa';

const features = [
  {
    icon: <FaCar className="w-6 h-6" />,
    title: "Detaylı Analiz",
    description: "Sürüş verileriniz detaylı olarak analiz edilir.",
  },
  {
    icon: <FaChartLine className="w-6 h-6" />,
    title: "Performans Takibi",
    description: "Zaman içindeki gelişiminizi takip edin.",
  },
  {
    icon: <FaRoad className="w-6 h-6" />,
    title: "Sürüş İpuçları",
    description: "Daha iyi bir sürücü olmak için kişiselleştirilmiş öneriler alın.",
  },
];

export default function FeaturesSection() {
  return (
    <div id="features" className="py-20 bg-white">
      {/* Animated background - Keep original structure but update colors if necessary */}
      <div className="absolute inset-0">
        {/* Keep original gradient structure, adjust colors */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-100 opacity-50" />
        {/* Radial gradient might not be needed in a light theme, can be removed or adjusted */}
        {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent" /> */}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-center text-gray-900 mb-12"
        >
          Özellikler
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative"
            >
              {/* Updated hover effect gradient color */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg blur-xl" />
              {/* Updated card background and border */}
              <div className="relative bg-white/50 backdrop-blur-sm p-6 rounded-lg border border-red-400/50 group-hover:border-red-500 transition-all cursor-pointer">
                {/* Updated icon color */}
                <motion.div
                  className="text-red-500 mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {feature.icon}
                </motion.div>
                {/* Updated title color */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                {/* Updated description color */}
                <p className="text-gray-600">{feature.description}</p>
                {/* Updated bottom border gradient color */}
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 