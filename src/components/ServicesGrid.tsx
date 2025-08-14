import { useState } from "react";
import { ServiceCard, Service } from "./ServiceCard";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface ServicesGridProps {
  services: Service[];
  searchValue: string;
}

const categoryLabels = {
  automation: 'Автоматизация',
  monitoring: 'Мониторинг',
  database: 'Базы данных',
  ai: 'Искусственный интеллект',
};

const categoryColors = {
  automation: 'default',
  monitoring: 'secondary',
  database: 'outline',
  ai: 'default',
} as const;

export function ServicesGrid({ services, searchValue }: ServicesGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter services based on search and category
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchValue.toLowerCase());
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group services by category
  const groupedServices = filteredServices.reduce((groups, service) => {
    const category = service.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(service);
    return groups;
  }, {} as Record<string, Service[]>);

  const categories = Object.keys(categoryLabels) as (keyof typeof categoryLabels)[];

  return (
    <div className="space-y-8">
      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="text-sm"
        >
          Все сервисы
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="text-sm"
          >
            {categoryLabels[category]}
            <Badge variant="secondary" className="ml-2 text-xs">
              {services.filter(s => s.category === category).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Services Grid */}
      {Object.entries(groupedServices).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">Сервисы не найдены</p>
          <p className="text-muted-foreground text-sm mt-2">
            Попробуйте изменить критерии поиска
          </p>
        </div>
      ) : (
        Object.entries(groupedServices).map(([category, categoryServices]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-foreground">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h2>
              <Badge variant={categoryColors[category as keyof typeof categoryColors]}>
                {categoryServices.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categoryServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}