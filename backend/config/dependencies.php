<?php

declare(strict_types=1);

use AnimePromptGen\Controllers\PromptController;
use AnimePromptGen\Controllers\AdventurerController;
use AnimePromptGen\Controllers\AlienController;
use AnimePromptGen\Controllers\UserSessionController;
use AnimePromptGen\Controllers\SpeciesController;
use AnimePromptGen\Controllers\TemplateController;
use AnimePromptGen\Controllers\DescriptionTemplateController;
use AnimePromptGen\Controllers\GameAssetsController;
use AnimePromptGen\Controllers\AnimeAttributesController;
use AnimePromptGen\Controllers\GeneratorAttributesController;
use AnimePromptGen\Controllers\AttributeConfigController;
use AnimePromptGen\Controllers\AttributeCategoryController;
use AnimePromptGen\Controllers\GeneratorTypesController;
use AnimePromptGen\External\GeneratorTypeRepository;
use AnimePromptGen\Actions\GetAnimeAttributesAction;
use AnimePromptGen\Actions\GetAttributeCategoriesAction;
use AnimePromptGen\Actions\GetAttributeOptionsByCategoryAction;
use AnimePromptGen\Actions\CreateAttributeOptionAction;
use AnimePromptGen\Actions\UpdateAttributeOptionAction;
use AnimePromptGen\Actions\DeleteAttributeOptionAction;
use AnimePromptGen\Actions\GetGeneratorAttributesAction;
use AnimePromptGen\Actions\GeneratePromptsAction;
use AnimePromptGen\Actions\GenerateAdventurerAction;
use AnimePromptGen\Actions\GenerateAlienAction;
use AnimePromptGen\Actions\GetSpeciesAction;
use AnimePromptGen\External\SpeciesRepository;
use AnimePromptGen\External\AttributeRepository;
use AnimePromptGen\External\PromptRepository;
use AnimePromptGen\External\AdventurerClassRepository;
use AnimePromptGen\External\AlienSpeciesRepository;
use AnimePromptGen\External\AlienTraitRepository;
use AnimePromptGen\External\UserSessionRepository;
use AnimePromptGen\External\TemplateRepository;
use AnimePromptGen\External\DescriptionTemplateRepository;
use AnimePromptGen\External\GameAttributeRepository;
use AnimePromptGen\External\UnifiedSpeciesRepository;
use AnimePromptGen\Actions\GetGameAttributesAction;
use AnimePromptGen\Actions\GetGameAttributeCategoriesAction;
use AnimePromptGen\Actions\InitializeGameAttributesAction;
use AnimePromptGen\Services\PromptGenerationService;
use AnimePromptGen\Services\AdventurerGenerationService;
use AnimePromptGen\Services\AlienGenerationService;
use AnimePromptGen\Services\RandomGeneratorService;

return [
    // Repositories (using Eloquent ORM only)
    SpeciesRepository::class => \DI\autowire(),
    AttributeRepository::class => \DI\autowire(),
    PromptRepository::class => \DI\autowire(),
    AdventurerClassRepository::class => \DI\autowire(),
    AlienSpeciesRepository::class => \DI\autowire(),
    AlienTraitRepository::class => \DI\autowire(),
    UserSessionRepository::class => \DI\autowire(),
    TemplateRepository::class => \DI\autowire(),
    DescriptionTemplateRepository::class => \DI\autowire(),
    GameAttributeRepository::class => \DI\autowire(),
    UnifiedSpeciesRepository::class => \DI\autowire(),
    GeneratorTypeRepository::class => \DI\autowire(),

    // Services
    RandomGeneratorService::class => \DI\autowire(),
    PromptGenerationService::class => \DI\autowire(),
    AdventurerGenerationService::class => \DI\autowire(),
    AlienGenerationService::class => \DI\autowire(),

    // Actions
    GeneratePromptsAction::class => \DI\autowire(),
    GenerateAdventurerAction::class => \DI\autowire(),
    GenerateAlienAction::class => \DI\autowire(),
    GetSpeciesAction::class => \DI\autowire(),
    GetGameAttributesAction::class => \DI\autowire(),
    GetGameAttributeCategoriesAction::class => \DI\autowire(),
    InitializeGameAttributesAction::class => \DI\autowire(),
    GetAnimeAttributesAction::class => \DI\autowire(),
    GetGeneratorAttributesAction::class => \DI\autowire(),
    GetAttributeCategoriesAction::class => \DI\autowire(),
    GetAttributeOptionsByCategoryAction::class => \DI\autowire(),
    CreateAttributeOptionAction::class => \DI\autowire(),
    UpdateAttributeOptionAction::class => \DI\autowire(),
    DeleteAttributeOptionAction::class => \DI\autowire(),

    // Controllers
    PromptController::class => \DI\autowire(),
    AdventurerController::class => \DI\autowire(),
    AlienController::class => \DI\autowire(),
    UserSessionController::class => \DI\autowire(),
    SpeciesController::class => \DI\autowire(),
    TemplateController::class => \DI\autowire(),
    DescriptionTemplateController::class => \DI\autowire(),
    GameAssetsController::class => \DI\autowire(),
    AnimeAttributesController::class => \DI\autowire(),
    GeneratorAttributesController::class => \DI\autowire(),
    AttributeConfigController::class => \DI\autowire(),
    AttributeCategoryController::class => \DI\autowire(),
    GeneratorTypesController::class => \DI\autowire(),
];
